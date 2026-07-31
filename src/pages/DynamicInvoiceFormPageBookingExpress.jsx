"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Save, Info } from "lucide-react";
import toast from "react-hot-toast";

// APIs
import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
import UKInvoiceApi from "../Api/ukInvoice.api"; // reused — Global invoices are saved through the same UK invoices API

// Shared UI components (generic — NOT the UK-specific calc components)
import { DynamicFormSection, SuccessModal } from "../components";

const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

// ─────────────────────────────────────────────────────────────────────────
// DATE / NIGHTS HELPERS
//
// Field ids are resolved from the config rather than hard-coded, so the same
// page works whether a config calls them check_in_date/check_out_date (Booking
// Express) or arrival_date/departure_date (hotel-direct style configs).
// ─────────────────────────────────────────────────────────────────────────
const CHECK_IN_KEYS = ["check_in_date", "checkin_date", "arrival_date", "arrival"];
const CHECK_OUT_KEYS = ["check_out_date", "checkout_date", "departure_date", "departure"];
const NIGHTS_KEYS = ["nights", "total_nights", "no_of_nights", "number_of_nights"];

const pickFieldId = (fields, candidates, fallback) => {
  const ids = new Set((fields || []).map((f) => f.field_id));
  return candidates.find((c) => ids.has(c)) || fallback;
};

/** 'YYYY-MM-DD' (or ISO) → UTC ms at midnight. null when unparseable. */
const toUtcDay = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  const ms = Date.UTC(y, m - 1, d);
  return Number.isFinite(ms) ? ms : null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whole nights between two dates. Date-only UTC arithmetic — a plain
 * `new Date(a) - new Date(b)` here would be off by one across a DST boundary
 * or for a browser in a negative UTC offset.
 */
const diffNights = (checkIn, checkOut) => {
  const a = toUtcDay(checkIn);
  const b = toUtcDay(checkOut);
  if (a === null || b === null) return null;
  return Math.round((b - a) / DAY_MS);
};

// ─────────────────────────────────────────────────────────────────────────
// Fixed line-item block — just Description + Price (EUR).
// ─────────────────────────────────────────────────────────────────────────
function LineItemSection({ title, currency, formData, onFieldChange }) {
  const values = formData.line_item || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <h3 className="text-sm md:text-base font-bold text-slate-800 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Description <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={values.description ?? ""}
            onChange={(e) => onFieldChange("line_item.description", e.target.value)}
            placeholder="e.g. Accommodation, City Tax, Spa..."
            required
            className="input input-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#1a1a2e] focus:outline-none rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Price ({currency}) <span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={values.price ?? ""}
            onChange={(e) => onFieldChange("line_item.price", e.target.value)}
            required
            className="input input-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#1a1a2e] focus:outline-none rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Map form data → backend payload.
// ─────────────────────────────────────────────────────────────────────────
const mapToGlobalBackendSchema = (formData, hotelConfig, fieldIds) => {
  const lineItem = formData.line_item || {};
  const grandTotal = parseNum(lineItem.price);

  const { line_item, status, note, ...topFields } = formData;

  // Persist nights as a number, and recompute it from the dates one last time
  // so the saved value can never disagree with the saved check-in/check-out
  // (e.g. if a stale value was loaded from an older record).
  const computed = diffNights(topFields[fieldIds.checkIn], topFields[fieldIds.checkOut]);
  if (computed !== null && computed >= 0) {
    topFields[fieldIds.nights] = computed;
  } else if (topFields[fieldIds.nights] !== "" && topFields[fieldIds.nights] !== undefined) {
    topFields[fieldIds.nights] = parseInt(topFields[fieldIds.nights], 10) || 0;
  }

  return {
    data: {
      invoiceSource: "global",

      hotel: hotelConfig?.hotel_name || "Booking Express",
      currency: hotelConfig?.currency || "EUR",

      ...topFields,

      // canonical alias so downstream/PDF code can read `nights` regardless of
      // which id this config used
      nights: topFields[fieldIds.nights] ?? 0,

      description: lineItem.description || "",
      status: status || "pending",
      note: note || "",

      lineItem,

      grandTotal,
      grandTotalGbp: grandTotal,
    },
  };
};

export default function DynamicInvoiceFormPageGlobal() {
  const navigate = useNavigate();
  const params = useParams();

  const isDuplicateMode = window.location.pathname.includes("/duplicate/");
  const isEditMode = Boolean(params.invoiceId && !params.hotelId && !isDuplicateMode);
  const invoiceId = params.invoiceId;
  const hotelIdFromRoute = params.hotelId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotelConfig, setHotelConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [savedInvoiceData, setSavedInvoiceData] = useState(null);
  const [dateError, setDateError] = useState("");

  // ── Which field ids this config uses for the date/nights trio ────────────
  const fieldIds = useMemo(() => {
    const fields = hotelConfig?.form_fields || [];
    return {
      checkIn: pickFieldId(fields, CHECK_IN_KEYS, "check_in_date"),
      checkOut: pickFieldId(fields, CHECK_OUT_KEYS, "check_out_date"),
      nights: pickFieldId(fields, NIGHTS_KEYS, "nights"),
    };
  }, [hotelConfig]);

  const checkInValue = formData[fieldIds.checkIn];
  const checkOutValue = formData[fieldIds.checkOut];

  // Nights is driven by the dates only while BOTH are present and in order.
  // Until then it stays a normal editable field.
  const computedNights = useMemo(
    () => diffNights(checkInValue, checkOutValue),
    [checkInValue, checkOutValue]
  );
  const nightsIsAuto = computedNights !== null && computedNights >= 0;

  useEffect(() => {
    if ((isEditMode || isDuplicateMode) && invoiceId) {
      loadInvoiceAndConfig();
    } else if (hotelIdFromRoute) {
      loadHotelConfig(hotelIdFromRoute);
    }
  }, [isEditMode, isDuplicateMode, invoiceId, hotelIdFromRoute]);

  // ── Date validation + nights auto-calculation ───────────────────────────
  // Blocks save when check-out lands BEFORE check-in. Same-day is allowed and
  // yields 0 nights (day-use / cancellation), since this config carries a
  // Cancellation Date — say the word if you want same-day rejected too.
  useEffect(() => {
    if (!hotelConfig) return;

    const hasBoth = Boolean(checkInValue && checkOutValue);
    if (!hasBoth) {
      setDateError("");
      return;
    }

    const nights = diffNights(checkInValue, checkOutValue);
    if (nights === null) {
      setDateError("");
      return;
    }

    if (nights < 0) {
      setDateError("Check-out date cannot be before the check-in date.");
      // Zero out the stale nights value so an invalid range can't leave a
      // plausible-looking number sitting in the field.
      setFormData((prev) =>
        String(prev[fieldIds.nights] ?? "") === "0" ? prev : { ...prev, [fieldIds.nights]: 0 }
      );
      return;
    }

    setDateError("");
    setFormData((prev) =>
      String(prev[fieldIds.nights] ?? "") === String(nights)
        ? prev // already correct — return prev to avoid a re-render loop
        : { ...prev, [fieldIds.nights]: nights }
    );
  }, [checkInValue, checkOutValue, fieldIds.nights, hotelConfig]);

  // ── Load existing invoice + matching config (Edit / Duplicate) ───────────
  const loadInvoiceAndConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const invoiceResponse = await UKInvoiceApi.getInvoiceById(invoiceId);
      let invoiceData = invoiceResponse.data || invoiceResponse;
      if (invoiceData.data?.data) invoiceData.data = invoiceData.data.data;
      const data = invoiceData.data || invoiceData;

      const allConfigsResponse = await getHotelConfigs();
      const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      const loadedConfig =
        allConfigs.find((c) => c.hotel_name === (data.hotel || data.hotelName)) ||
        allConfigs.find((c) => (c.country || "").toLowerCase() === "global");

      if (!loadedConfig) throw new Error("No Global hotel configuration found");

      setHotelConfig(loadedConfig);

      // Rebuild top-level fields dynamically from whatever the config defines
      const topFieldValues = {};
      (loadedConfig.form_fields || []).forEach((f) => {
        // dates come back as ISO strings — trim to YYYY-MM-DD so the date
        // inputs and the night arithmetic both get a clean value
        const raw = data[f.field_id] ?? "";
        topFieldValues[f.field_id] =
          f.data_type === "date" && raw ? String(raw).split("T")[0] : raw;
      });

      setFormData({
        ...topFieldValues,
        status: data.status || "pending",
        note: data.note || "",
        line_item: data.lineItem || {
          description: data.description || "",
          price: data.grandTotal ?? "",
        },
      });

      toast.success(
        isDuplicateMode ? "Invoice loaded for duplication" : "Invoice loaded successfully",
        { duration: 2000 }
      );
    } catch (err) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  // ── Load hotel config (Create mode) ───────────────────────────────────────
  const loadHotelConfig = async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHotelConfigById(hotelId);
      setHotelConfig(response);
      setFormData({
        hotel_name_ref: response.hotel_name || "",
        status: "pending",
        note: "",
        line_item: {},
      });
    } catch (err) {
      setError(err.message || "Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  // ── Field change handler (supports "section.field" paths) ────────────────
  // Two jobs beyond the plain write:
  //  1. Nights guard — while both dates are set, typed edits to nights are
  //     ignored (authoritative here, since DynamicFormSection may not honour
  //     a read_only flag).
  //  2. Nights auto-fill happens SYNCHRONOUSLY in the same state update as
  //     the date change — it does not wait for the validation effect, so the
  //     field updates in the same render no matter how the date input emits.
  const handleFieldChange = useCallback(
    (fieldPath, value) => {
      if (fieldPath === fieldIds.nights && nightsIsAuto) return;

      setFormData((prev) => {
        const parts = fieldPath.split(".");
        if (parts.length > 1) {
          return {
            ...prev,
            [parts[0]]: { ...(prev[parts[0]] || {}), [parts[1]]: value },
          };
        }

        const next = { ...prev, [parts[0]]: value };

        // A date changed → recompute nights immediately off the NEW values
        if (parts[0] === fieldIds.checkIn || parts[0] === fieldIds.checkOut) {
          const n = diffNights(next[fieldIds.checkIn], next[fieldIds.checkOut]);
          if (n !== null) next[fieldIds.nights] = n >= 0 ? n : 0;
        }

        return next;
      });
    },
    [fieldIds.checkIn, fieldIds.checkOut, fieldIds.nights, nightsIsAuto]
  );

  // ── Fields handed to DynamicFormSection ─────────────────────────────────
  // nights is flagged read-only/auto once the dates drive it, and each date
  // input gets a min/max so the picker itself discourages an invalid range.
  const decoratedFields = useMemo(() => {
    return (hotelConfig?.form_fields || []).map((f) => {
      if (f.field_id === fieldIds.nights) {
        return {
          ...f,
          read_only: nightsIsAuto,
          auto_calculated: nightsIsAuto,
          disabled: nightsIsAuto,
          placeholder: nightsIsAuto ? "" : "Set check-in & check-out",
          helper_text: nightsIsAuto
            ? "Calculated from check-in and check-out"
            : "Fill in both dates to calculate automatically",
        };
      }
      if (f.field_id === fieldIds.checkOut) {
        return { ...f, min: checkInValue ? String(checkInValue).split("T")[0] : undefined, minDate: checkInValue ? String(checkInValue).split("T")[0] : undefined };
      }
      if (f.field_id === fieldIds.checkIn) {
        return { ...f, max: checkOutValue ? String(checkOutValue).split("T")[0] : undefined, maxDate: checkOutValue ? String(checkOutValue).split("T")[0] : undefined };
      }
      return f;
    });
  }, [hotelConfig, fieldIds, nightsIsAuto, checkInValue, checkOutValue]);

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const lineItem = formData.line_item || {};

    if (dateError) {
      toast.error(dateError, { position: "top-center" });
      return;
    }

    // `!lineItem.price` also rejected a legitimate 0.00 (fully-waived or
    // cancelled booking) — check for "empty", not for "falsy".
    const priceMissing =
      lineItem.price === undefined || lineItem.price === null || String(lineItem.price).trim() === "";

    if (!formData.invoice_number || !lineItem.description || priceMissing) {
      toast.error("Please fill in the required fields before saving", { position: "top-center" });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Saving invoice...", { position: "top-center" });

    try {
      const payload = mapToGlobalBackendSchema(formData, hotelConfig, fieldIds);

      if (isEditMode) {
        await UKInvoiceApi.updateInvoice(invoiceId, payload);
      } else {
        await UKInvoiceApi.createInvoice(payload);
      }

      toast.dismiss(loadingToast);

      setSavedInvoiceData({
        isEdit: isEditMode,
        invoiceNumber: formData.invoice_number || "NEW",
        status: formData.status,
        grandTotal: parseNum(lineItem.price),
        currency: hotelConfig?.currency || "EUR",
      });

      setTimeout(() => {
        const modalElement = document.getElementById("success_modal");
        if (modalElement) modalElement.showModal();
        else {
          toast.success("Invoice saved successfully!");
          navigate("/invoices");
        }
      }, 100);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to save invoice", { duration: 6000 });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#1a1a2e]" />
      </div>
    );
  if (error)
    return <div className="min-h-screen bg-[#f8fafc] p-6 text-red-600">Error: {error}</div>;
  if (!hotelConfig) return null;

  const lineItemTitle = hotelConfig.line_item_section?.title || "Charges";

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button onClick={() => navigate("/invoices")} className="flex items-center gap-2 text-slate-600 mb-4">
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold">
            {isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {hotelConfig.hotel_name}{" "}
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded ml-1">🌍 Global</span>
          </p>
        </div>

        {/* Date validation error */}
        {dateError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 font-medium text-sm">{dateError}</p>
          </div>
        )}

        {/* Nights readout — confirms what the dates produced */}
        {!dateError && nightsIsAuto && (
          <div className="mb-4 bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="text-sky-900 text-sm">
              <span className="font-semibold">
                {computedNights} night{computedNights === 1 ? "" : "s"}
              </span>{" "}
              calculated from {String(checkInValue).split("T")[0]} → {String(checkOutValue).split("T")[0]}
              {computedNights === 0 && " (same-day — no overnight stay)"}
            </p>
          </div>
        )}

        {isDuplicateMode && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 font-medium text-sm">
              You are creating a duplicate. Please update the invoice number before saving to avoid conflicts.
            </p>
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          {/* Top: fully dynamic — every field in hotelConfig.form_fields renders here */}
          <DynamicFormSection
            title="Invoice Information"
            fields={decoratedFields}
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          {/* Bottom: fixed, always visible — just Description + Price. No toggle. */}
          <LineItemSection
            title={lineItemTitle}
            currency={hotelConfig.currency || "EUR"}
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          {/* Status / note */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={formData.status || "pending"}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="ready">Ready</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
                <input
                  type="text"
                  value={formData.note || ""}
                  onChange={(e) => handleFieldChange("note", e.target.value)}
                  className="input input-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom save bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-20">
          <div className="flex justify-end gap-4 max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/invoices")}
              disabled={isSaving}
              className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !!dateError}
              className="w-full sm:w-auto bg-[#1a1a2e] hover:bg-[#0d0d1a] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isDuplicateMode ? "Creating Duplicate..." : isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isDuplicateMode ? "Create Duplicate" : isEditMode ? "Update Invoice" : "Save Invoice"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {savedInvoiceData && (
        <SuccessModal
          isEdit={savedInvoiceData.isEdit}
          invoiceNumber={savedInvoiceData.invoiceNumber}
          status={savedInvoiceData.status}
          grandTotal={savedInvoiceData.grandTotal}
          currency={savedInvoiceData.currency}
          onClose={() => navigate("/invoices")}
        />
      )}
    </div>
  );
}
