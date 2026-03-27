"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
import {
  DynamicFormSection,
  SuccessModal,
  TurkeyConditionalSection,
  TurkeySummarySection
} from "../components";


// ── V2 calculation utilities (Turkey-specific) ─────────────────────────────
import {
  detectHotelType,
  mapToBackendSchema,
  calculateFinalSummary,
  HOTEL_CONFIGS,
  parseNum,
} from "../utils/invoiceCalculationsTurkey";

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL-SPECIFIC EXTRA FIELDS
// Each hotel type surfaces additional fields that feed mapToBackendSchema.
// These are rendered below the standard DynamicFormSection.
// ─────────────────────────────────────────────────────────────────────────────

const HOTEL_EXTRA_FIELDS = {
  // ── Radisson (all three variants) ────────────────────────────────────────
  RADISSON_HARBIYE:    ["invoice_n", "billing_date", "party", "branch", "reservation"],
  RADISSON_COLLECTION: ["invoice_n", "billing_date", "party", "branch", "reservation"],
  RADISSON_BLU_SISLI:  ["invoice_n", "billing_date", "party", "branch", "reservation"],

  // ── Cheya Nişantaşı ──────────────────────────────────────────────────────
  CHEYA: ["folyo_no", "oda_no", "room_type", "kisi"],

  // ── Marmara Taksim ───────────────────────────────────────────────────────
  MARMARA_TAKSIM: [
    "ar_number",
    "conf_no",
    "cashier_no",
    "group_code",
    "company_name",
    "account_no",
  ],

  // ── Hilton Bosphorus ─────────────────────────────────────────────────────
  HILTON_BOSPHORUS: [
    "rate_plan",
    "confirmation_no",
    "cashier_id",
    "frequent_flyer",
    "hilton_honors",
  ],

  // ── Yotelair Airport ─────────────────────────────────────────────────────
  YOTELAIR: [
    "invoice_number",
    "folio_number",
    "confirmation_number",
    "iata_number",
    "number_of_guests",
  ],
};

// Human-readable labels for every extra field
const EXTRA_FIELD_LABELS = {
  invoice_n:           "Invoice N°",
  billing_date:        "Billing Date",
  party:               "Party",
  branch:              "Branch",
  reservation:         "Reservation",
  folyo_no:            "Folyo No",
  oda_no:              "Oda No",
  room_type:           "Room Type",
  kisi:                "Kişi (Pax)",
  ar_number:           "AR Number",
  conf_no:             "Conf. No",
  cashier_no:          "Cashier No",
  group_code:          "Group Code",
  company_name:        "Company Name",
  account_no:          "Account No",
  rate_plan:           "Rate Plan",
  confirmation_no:     "Confirmation No",
  cashier_id:          "Cashier ID",
  frequent_flyer:      "Frequent Flyer",
  hilton_honors:       "Hilton Honors",
  invoice_number:      "Invoice Number",
  folio_number:        "Folio Number",
  confirmation_number: "Confirmation Number",
  iata_number:         "IATA Number",
  number_of_guests:    "Number of Guests",
};

// Fields that should render as <input type="date">
const DATE_EXTRA_FIELDS = new Set(["billing_date"]);

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE EXTRA-FIELDS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function HotelExtraFieldsPanel({ hotelType, formData, onFieldChange }) {
  const fields = HOTEL_EXTRA_FIELDS[hotelType];
  if (!fields || fields.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Hotel-Specific Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((fieldId) => {
          const isDate = DATE_EXTRA_FIELDS.has(fieldId);
          const label  = EXTRA_FIELD_LABELS[fieldId] || fieldId;
          const value  = formData[fieldId] ?? "";

          return (
            <div key={fieldId} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {label}
              </label>
              <input
                type={isDate ? "date" : "text"}
                name={fieldId}
                value={value}
                onChange={(e) => onFieldChange(fieldId, e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002a5c]/30 focus:border-[#002a5c] transition-colors"
                placeholder={isDate ? "" : `Enter ${label.toLowerCase()}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DynamicInvoiceFormTurkey() {
  const navigate = useNavigate();
  const params   = useParams();

  // Determine mode from URL
  const isDuplicateMode  = window.location.pathname.includes("/duplicate/");
  const isEditMode       = Boolean(params.invoiceId && !params.hotelId && !isDuplicateMode);
  const invoiceId        = params.invoiceId;
  const hotelIdFromRoute = params.hotelId;

  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [hotelConfig,      setHotelConfig]      = useState(null);
  const [isSaving,         setIsSaving]         = useState(false);
  const [dateError,        setDateError]        = useState("");
  const [formData,         setFormData]         = useState({});
  const [savedInvoiceData, setSavedInvoiceData] = useState(null);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if ((isEditMode || isDuplicateMode) && invoiceId) {
      loadInvoiceAndConfig();
    } else if (hotelIdFromRoute) {
      loadHotelConfig(hotelIdFromRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, isDuplicateMode, invoiceId, hotelIdFromRoute]);

  // ── Auto-calculate nights ─────────────────────────────────────────────────
  useEffect(() => {
    if (!formData.arrival_date || !formData.departure_date) return;

    const arrival   = new Date(formData.arrival_date);
    const departure = new Date(formData.departure_date);

    if (departure <= arrival) {
      setDateError("Departure date must be after arrival date");
      if (formData.accommodation_details?.total_nights) {
        setFormData((prev) => ({
          ...prev,
          accommodation_details: {
            ...prev.accommodation_details,
            total_nights: 0,
          },
        }));
      }
      return;
    }

    setDateError("");
    const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

    if (formData.accommodation_details) {
      setFormData((prev) => ({
        ...prev,
        accommodation_details: {
          ...prev.accommodation_details,
          total_nights: diffDays,
        },
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.arrival_date, formData.departure_date]);

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadInvoiceAndConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      let invoiceData = invoiceResponse.data || invoiceResponse;
      if (invoiceData.data?.data) invoiceData.data = invoiceData.data.data;

      const data      = invoiceData.data || invoiceData;
      const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";

      const allConfigsResponse = await getHotelConfigs();
      const allConfigs         = allConfigsResponse.data || allConfigsResponse || [];

      let config = allConfigs.find((c) => c.hotel_name === hotelName);
      if (!config && allConfigs.length > 0) config = allConfigs[0];
      if (!config) throw new Error("No hotel configuration found");

      setHotelConfig(config);
      setFormData(mapInvoiceToForm(invoiceData, config));

      toast.success(isDuplicateMode ? "Invoice loaded for duplication" : "Invoice loaded successfully", {
        duration: 2000,
        icon: isDuplicateMode ? "📋" : "📄",
      });
    } catch (err) {
      setError(err.message || "Failed to load invoice");
      toast.error(err.message || "Failed to load invoice", { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const loadHotelConfig = async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHotelConfigById(hotelId);
      setHotelConfig(response);
      initializeFormData(response);
      toast.success("Hotel configuration loaded", { duration: 2000, icon: "🏨" });
    } catch (err) {
      setError(err.message || "Failed to load hotel configuration");
      toast.error(err.message || "Failed to load hotel configuration", { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  // ── Map saved invoice → form shape ────────────────────────────────────────
  const mapInvoiceToForm = (invoiceData, config) => {
    let data = invoiceData;
    if (data?.data) data = data.data;
    if (data?.data) data = data.data;

    const accommodationConfig = config?.conditional_sections?.accommodation_details;
    const servicesConfig      = config?.conditional_sections?.other_services;

    // Build accommodation details from backend fields
    const accommodationDetails = {};
    if (accommodationConfig?.fields) {
      accommodationConfig.fields.forEach((field) => {
        const id = field.field_id;
        let val  = null;

        if (data[id] !== undefined)                               val = data[id];
        else if (id === "eur_amount"    && data.eurAmount     !== undefined) val = data.eurAmount;
        else if (id === "exchange_rate" && data.exchangeRate  !== undefined) val = data.exchangeRate;
        else if (id === "total_nights"  && data.nights        !== undefined) val = data.nights;
        // Grand Aras / legacy field aliases
        else if (id === "room_amount_try")       val = data.room_amount_try       || data.roomAmountTry   || data.sellingRate;
        else if (id === "total_room_all_nights") val = data.total_room_all_nights || data.totalRoomAllNights || data.subTotal;
        else if (id === "taxable_amount_room")   val = data.taxable_amount_room   || data.taxableAmount   || data.taxable_amount;
        else if (id === "vat_10_percent")        val = data.vat_10_percent        || data.vat10Percent    || data.vat1_10;
        else if (id === "accommodation_tax")     val = data.accommodation_tax     || data.accommodationTax || data.accommodationTaxTotal;
        // CVK aliases
        else if (id === "taxable_amount")        val = data.taxable_amount        || data.sellingRate;
        else if (id === "total_per_night")       val = data.total_per_night       || data.subTotal;
        else if (id === "vat_total_nights")      val = data.vat_total_nights      || data.vat7;
        else if (id === "acc_tax_total_nights")  val = data.acc_tax_total_nights  || data.accommodationTaxTotal;

        accommodationDetails[id] = val !== null ? val : "";
      });
    }

    // Build services array
    const otherServices = [];
    if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service) => {
        const mapped = { id: Date.now() + Math.random() };
        servicesConfig.fields.forEach((field) => {
          const id = field.field_id;
          if      (id === "service_name"   && service.name             !== undefined) mapped[id] = service.name;
          else if (id === "service_date"   && service.date             !== undefined) mapped[id] = service.date;
          else if (id === "gross_amount"   && service.amount           !== undefined) mapped[id] = service.amount;
          else if (id === "taxable_amount" && service.taxable_amount   !== undefined) mapped[id] = service.taxable_amount;
          else if (id === "vat_20_percent" && service.vat_20_percent   !== undefined) mapped[id] = service.vat_20_percent;
          else if (service[id]             !== undefined)                              mapped[id] = service[id];
          else                                                                         mapped[id] = "";
        });
        otherServices.push(mapped);
      });
    }

    return {
      // ── Standard fields ───────────────────────────────────────────────────
      hotel_name:    data.hotel       || config?.hotel_name || "",
      currency:      config?.currency || "TRY",
      guest_name:    data.guestName   || "",
      arrival_date:  data.arrivalDate || "",
      departure_date:data.departureDate || "",
      invoice_date:  data.invoiceDate || "",
      room_number:   data.roomNo      || "",
      adults:        String(data.paxAdult || 1),
      children:      String(data.paxChild || 0),
      pax:           String(data.pax || data.paxAdult || 1),
      passport_no:   data.passportNo  || "",
      user_code:     data.userId      || "",
      cash_no:       data.batchNo     || "",
      page_number:   data.batchNo     || "",
      voucher_no:    data.voucherNo   || "",
      folio_no:      data.folioNo     || data.folio_no || "",
      folio_number:  data.folioNumber || data.folio_number || "",
      reference_no:  data.referenceNo || "",
      company_name:  data.referenceNo || data.company_name || "",
      v_d:           data.vd          || "",
      v_no:          data.vNo         || "",
      status:        data.status      || "pending",
      note:          data.note        || "",

      // ── Radisson extra fields ─────────────────────────────────────────────
      invoice_n:   data.invoiceN   || "",
      billing_date:data.billingDate|| "",
      party:       data.party      || "",
      branch:      data.branch     || "",
      reservation: data.reservation|| "",

      // ── Cheya extra fields ────────────────────────────────────────────────
      folyo_no:  data.folyoNo   || "",
      oda_no:    data.odaNo     || "",
      room_type: data.roomType  || "",
      kisi:      data.kisi      || "",

      // ── Marmara extra fields ──────────────────────────────────────────────
      ar_number:   data.arNumber   || "",
      conf_no:     data.confNo     || "",
      cashier_no:  data.cashierNo  || "",
      group_code:  data.groupCode  || "",
      account_no:  data.accountNo  || "",

      // ── Hilton extra fields ───────────────────────────────────────────────
      rate_plan:       data.ratePlan       || "",
      confirmation_no: data.confirmationNo || "",
      cashier_id:      data.cashierId      || "",
      frequent_flyer:  data.frequentFlyer  || "",
      hilton_honors:   data.hiltonHonors   || "",

      // ── Yotelair extra fields ─────────────────────────────────────────────
      invoice_number:      data.invoiceNumber      || "",
      confirmation_number: data.confirmationNumber || "",
      iata_number:         data.iataNumber         || "",
      number_of_guests:    data.numberOfGuests      || data.adults || 1,

      // ── Sections ──────────────────────────────────────────────────────────
      accommodation_details: accommodationDetails,
      other_services:        otherServices,
    };
  };

  // ── Initialize blank form from hotel config ───────────────────────────────
  const initializeFormData = (config) => {
    const hotelType   = detectHotelType(config);
    const extraFields = HOTEL_EXTRA_FIELDS[hotelType] || [];

    const initial = {
      hotel_name: config.hotel_name,
      currency:   config.currency || "TRY",
      pax:        "1",
      status:     "pending",
      note:       "",
    };

    // Blank out every extra field for this hotel type
    extraFields.forEach((f) => { initial[f] = ""; });

    // Standard form fields from config
    config.form_fields?.forEach((field) => {
      initial[field.field_id] = "";
    });

    // Conditional sections
    Object.entries(config.conditional_sections || {}).forEach(([key, section]) => {
      if (!section.enabled) return;

      if (section.multiple_entries) {
        initial[key] = [];
      } else {
        initial[key] = {};
        section.fields?.forEach((field) => {
          initial[key][field.field_id] = field.fixed_value || "";
        });
      }
    });

    setFormData(initial);
  };

  // ── Field change handler ──────────────────────────────────────────────────
  const handleFieldChange = (fieldPath, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const parts   = fieldPath.split(".");

      if (parts.length === 1) {
        newData[parts[0]] = value;

        // Keep pax in sync with adults when adults changes
        if (parts[0] === "adults") {
          newData.pax = value;
        }
      } else if (parts.length === 2) {
        if (!newData[parts[0]]) newData[parts[0]] = {};
        newData[parts[0]] = { ...newData[parts[0]], [parts[1]]: value };
      }

      return newData;
    });
  };

  const handleStatusChange = (newStatus) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
    toast.success(`Status: ${newStatus}`, {
      duration: 2000,
      position: "bottom-right",
      icon: newStatus === "ready" ? "✅" : "⏳",
    });
  };

  const handleNoteChange = (newNote) => {
    setFormData((prev) => ({ ...prev, note: newNote }));
  };

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (dateError) {
      toast.error("Please fix date errors before saving", { duration: 3000, position: "top-center" });
      return;
    }
    if (!formData.arrival_date || !formData.departure_date) {
      toast.error("Please select arrival and departure dates", { duration: 3000, position: "top-center" });
      return;
    }
    if (!formData.guest_name) {
      toast.error("Guest name is required", { duration: 3000, position: "top-center" });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading(
      isDuplicateMode ? "Creating duplicate invoice…" : isEditMode ? "Updating invoice…" : "Creating invoice…",
      { position: "top-center" }
    );

    try {
      const hotelType = detectHotelType(hotelConfig);

      // ── Merge extra fields into formData before mapping ──────────────────
      // mapToBackendSchema reads top-level formData keys directly,
      // so all extra fields are already present — nothing extra needed.
      const invoicePayload = mapToBackendSchema(formData, hotelConfig);
      const summary        = calculateFinalSummary(formData, hotelType);

      let response;
      if (isEditMode) {
        response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
      } else {
        response = await turkeyInvoiceApi.createInvoice(invoicePayload);
      }

      toast.dismiss(loadingToast);

      setSavedInvoiceData({
        isEdit:        isEditMode,
        invoiceNumber: formData.company_name || formData.reference_no || (isEditMode ? invoiceId.substring(0, 8) : "NEW"),
        status:        formData.status,
        grandTotal:    summary.grand_total,
        currency:      hotelConfig.currency,
      });

      setTimeout(() => {
        const modal = document.getElementById("success_modal");
        if (modal) {
          modal.showModal();
        } else {
          toast.success("Invoice saved successfully!", { duration: 2000 });
          setTimeout(() => navigate("/invoices"), 1500);
        }
      }, 100);
    } catch (error) {
      toast.dismiss(loadingToast);

      let errorMessage = "Failed to save invoice";

      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail;
        if (
          detail &&
          (detail.toLowerCase().includes("duplicate") ||
            detail.toLowerCase().includes("reference") ||
            detail.toLowerCase().includes("already exists"))
        ) {
          errorMessage = "Reference number already exists. Please use a different reference number.";
          toast.error(errorMessage, { duration: 6000, position: "top-center", icon: "⚠️" });
          setTimeout(() => {
            const refField = document.querySelector('[name="company_name"]');
            if (refField) {
              refField.scrollIntoView({ behavior: "smooth", block: "center" });
              refField.focus();
            }
          }, 500);
          setIsSaving(false);
          return;
        }
      }

      if (error.response?.data?.detail) {
        errorMessage = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map((e) => `${e.loc?.join(".")}: ${e.msg}`).join(", ")
          : error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, { duration: 6000, position: "top-center" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => navigate("/invoices");

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
      navigate("/invoices");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
          <p className="text-slate-600 text-lg">
            {isDuplicateMode
              ? "Loading invoice to duplicate…"
              : isEditMode
              ? "Loading invoice…"
              : "Loading hotel configuration…"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => navigate("/invoices")}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotelConfig) return null;

  const hotelType = detectHotelType(hotelConfig);

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate("/invoices")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Invoices</span>
          </button>

          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            {isDuplicateMode ? "Duplicate Invoice" : isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
            {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
            {["GRAND_ARAS", "TRYP"].includes(hotelType) && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {hotelType === "TRYP" ? "TRYP Mode" : "Grand Aras Mode"}
              </span>
            )}
            {isDuplicateMode && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Duplicate Mode
              </span>
            )}
          </p>
        </div>

        {/* ── Banners ──────────────────────────────────────────────────────── */}
        {dateError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 font-medium text-sm">{dateError}</p>
          </div>
        )}

        {isDuplicateMode && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 font-medium text-sm">
              You are creating a duplicate. Please update the reference number before saving to avoid conflicts.
            </p>
          </div>
        )}

        {/* ── Form sections ────────────────────────────────────────────────── */}
        <div className="space-y-4 md:space-y-6">

          {/* Standard fields driven by hotel config */}
          <DynamicFormSection
            title="Invoice Information"
            fields={hotelConfig.form_fields || []}
            formData={formData}
            onFieldChange={handleFieldChange}
            dateError={dateError}
          />

          {/* Hotel-specific extra fields (Radisson / Cheya / Marmara / etc.) */}
          <HotelExtraFieldsPanel
            hotelType={hotelType}
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          {/* Turkey V2 conditional sections (accommodation_details, other_services)
              TurkeyConditionalSection handles live auto-calculation internally:
              – accommodation_details : recalculates a/b/d/g/j on every keystroke
              – other_services        : recalculates taxable + VAT20 per row     */}
          {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
            if (!section.enabled) return null;
            // Skip empty placeholder sections (city_tax, stamp_tax, etc.)
            if (!section.fields || section.fields.length === 0) return null;
            return (
              <TurkeyConditionalSection
                key={sectionKey}
                sectionKey={sectionKey}
                section={section}
                formData={formData}
                onFieldChange={handleFieldChange}
                setFormData={setFormData}
                hotelConfig={hotelConfig}
              />
            );
          })}

          {/* Turkey V2 summary — live totals + Radisson per-night breakdown */}
          <TurkeySummarySection
            config={hotelConfig}
            formData={formData}
            onStatusChange={handleStatusChange}
            onNoteChange={handleNoteChange}
          />
        </div>

        {/* ── Sticky footer ────────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !!dateError}
              className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isDuplicateMode ? "Creating Duplicate…" : isEditMode ? "Updating…" : "Saving…"}
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

      {/* ── Success modal ─────────────────────────────────────────────────── */}
      {savedInvoiceData && (
        <SuccessModal
          isEdit={savedInvoiceData.isEdit}
          invoiceNumber={savedInvoiceData.invoiceNumber}
          status={savedInvoiceData.status}
          grandTotal={savedInvoiceData.grandTotal}
          currency={savedInvoiceData.currency}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}