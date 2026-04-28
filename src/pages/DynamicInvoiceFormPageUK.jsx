"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";

// APIs
import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
import UKInvoiceApi from "../Api/ukInvoice.api";

// Shared UI components
import { DynamicFormSection, SuccessModal , UKConditionalSection, UKSummarySection} from "../components";


// UK Math
import {
  calculateUKFinalSummary,
  mapToUKBackendSchema,
  detectUKHotelType,
} from "../utils/invoiceCalculationsUK";

export default function DynamicInvoiceFormPageUK() {
  const navigate = useNavigate();
  const params = useParams();

  const isDuplicateMode = window.location.pathname.includes("/duplicate/");
  const isEditMode = Boolean(
    params.invoiceId && !params.hotelId && !isDuplicateMode
  );
  const invoiceId = params.invoiceId;
  const hotelIdFromRoute = params.hotelId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotelConfig, setHotelConfig] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dateError, setDateError] = useState("");
  const [formData, setFormData] = useState({});
  const [savedInvoiceData, setSavedInvoiceData] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if ((isEditMode || isDuplicateMode) && invoiceId) {
      loadInvoiceAndConfig();
    } else if (hotelIdFromRoute) {
      loadHotelConfig(hotelIdFromRoute);
    }
  }, [isEditMode, isDuplicateMode, invoiceId, hotelIdFromRoute]);

  // ── Date Validation & Auto Night Count ───────────────────────────────────
  useEffect(() => {
    if (!formData.arrival_date || !formData.departure_date) return;

    const arrival = new Date(formData.arrival_date);
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
    const diffDays = Math.ceil(
      (departure - arrival) / (1000 * 60 * 60 * 24)
    );

    if (formData.accommodation_details) {
      setFormData((prev) => ({
        ...prev,
        accommodation_details: {
          ...prev.accommodation_details,
          total_nights: diffDays,
        },
      }));
    }
  }, [formData.arrival_date, formData.departure_date]);

  // ── Summary Re-calculation ────────────────────────────────────────────────
  useEffect(() => {
    if (hotelConfig && formData.accommodation_details) {
      try {
        const newSummary = calculateUKFinalSummary(formData);
        setSummary(newSummary);
      } catch (err) {
        console.error("Error calculating UK summary:", err);
      }
    }
  }, [
    formData.accommodation_details,
    formData.other_services,
    hotelConfig,
  ]);

  // ── Load Invoice + Config (Edit / Duplicate mode) ─────────────────────────
  const loadInvoiceAndConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const invoiceResponse = await UKInvoiceApi.getInvoiceById(invoiceId);
      let invoiceData = invoiceResponse.data || invoiceResponse;
      if (invoiceData.data?.data) invoiceData.data = invoiceData.data.data;

      const data = invoiceData.data || invoiceData;
      const hotelName = data.hotel_name || data.hotel || "";

      const allConfigsResponse = await getHotelConfigs();
      const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      let loadedConfig =
        allConfigs.find((c) => c.hotel_name === hotelName) || allConfigs[0];

      if (!loadedConfig) throw new Error("No hotel configuration found");

      setHotelConfig(loadedConfig);
      setFormData(mapInvoiceToForm(invoiceData, loadedConfig));
      toast.success(
        isDuplicateMode
          ? "Invoice loaded for duplication"
          : "Invoice loaded successfully",
        { duration: 2000 }
      );
    } catch (err) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  // ── Load Hotel Config (Create mode) ──────────────────────────────────────
  const loadHotelConfig = async (hotelId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHotelConfigById(hotelId);
      setHotelConfig(response);
      initializeFormData(response);
    } catch (err) {
      setError(err.message || "Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  // ── Map Saved Invoice → Form Fields ──────────────────────────────────────
  const mapInvoiceToForm = (invoiceData, hotelConfig) => {
    let data = invoiceData;
    if (data?.data) data = data.data;
    if (data?.data) data = data.data;

    const accConfig = hotelConfig?.conditional_sections?.accommodation_details;
    const servicesConfig = hotelConfig?.conditional_sections?.other_services;
    const accommodationDetails = {};

    if (accConfig?.fields) {
      accConfig.fields.forEach((field) => {
        const fieldId = field.field_id;
        if (fieldId === "gbp_amount")
          accommodationDetails[fieldId] = data.gbpAmount || data.gbp_amount || "";
        else if (fieldId === "total_nights")
          accommodationDetails[fieldId] = data.nights || data.total_nights || "";
        else if (fieldId === "nightly_net_gbp")
          accommodationDetails[fieldId] = data.nightlyNet || "";
        else if (fieldId === "nightly_vat_gbp")
          accommodationDetails[fieldId] = data.nightlyVat || "";
        else if (fieldId === "nightly_gross_gbp")
          accommodationDetails[fieldId] = data.nightlyGross || "";
        else if (fieldId === "total_room_net")
          accommodationDetails[fieldId] = data.totalRoomNet || "";
        else if (fieldId === "total_room_vat")
          accommodationDetails[fieldId] = data.totalRoomVat || "";
        else if (fieldId === "total_room_gross")
          accommodationDetails[fieldId] = data.totalRoomGross || "";
        else
          accommodationDetails[fieldId] =
            data[fieldId] !== undefined ? data[fieldId] : "";
      });
    }

    const otherServices = [];
    if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
      data.otherServices.forEach((service) => {
        const mappedService = { id: Date.now() + Math.random() };
        servicesConfig.fields.forEach((field) => {
          const fieldId = field.field_id;
          if (fieldId === "service_name")
            mappedService[fieldId] = service.service_type || service.name || "";
          else if (fieldId === "service_date")
            mappedService[fieldId] = service.date || "";
          else if (fieldId === "gross_amount")
            mappedService[fieldId] = service.amount || service.total || "";
          else if (fieldId === "net_amount")
            mappedService[fieldId] = service.net || "";
          else if (fieldId === "vat_amount")
            mappedService[fieldId] = service.vat_amount || "";
          else mappedService[fieldId] = service[fieldId] || "";
        });
        otherServices.push(mappedService);
      });
    }

    return {
      // Hotel / Property Information
      reference_no: data.referenceNo || "",
      hotel_name: data.hotel_name || data.hotel || hotelConfig?.hotel_name || "",
      vat_no: data.vatNo || data.vat_no || "",
      company_reg_no: data.companyRegNo || data.company_reg_no || "",
      hotel_address: data.hotelAddress || data.hotel_address || "",
      hotel_phone: data.hotelPhone || data.hotel_phone || "",
      hotel_fax: data.hotelFax || data.hotel_fax || "",
      hotel_email: data.hotelEmail || data.hotel_email || "",

      // Guest & Client
      guest_name: data.guestName || data.guest_name || "",
      company_name: data.companyName || data.company_name || "",
      address: data.address || "",
      nationality: data.nationality || "",
      guest_phone: data.guestPhone || data.guest_phone || "",
      guest_email: data.guestEmail || data.guest_email || "",
      honors_no: data.honorsNo || data.honors_no || "",
      adults: String(data.adults || data.paxAdult || 1),
      children: String(data.children || data.paxChild || 0),

      // Stay Details
      room_number: data.roomNo || data.room_number || "",
      room_type: data.roomType || data.room_type || "",
      room_description: data.roomDescription || data.room_description || "",
      arrival_date: data.arrivalDate || data.arrival_date || "",
      arrival_time: data.arrivalTime || data.arrival_time || "",
      departure_date: data.departureDate || data.departure_date || "",
      departure_time: data.departureTime || data.departure_time || "",
      rate_plan: data.ratePlan || data.rate_plan || "",
      conf_no: data.confNo || data.conf_no || "",
      reservation_no: data.reservationNo || data.reservation_no || "",
      group_code: data.groupCode || data.group_code || "",

      // Invoice Metadata
      vat_invoice_no: data.vatInvoiceNo || data.vat_invoice_no || "",
      invoice_no: data.invoiceNo || data.invoice_no || "",
      folio_no: data.folioNo || data.folio_no || "",
      invoice_date: data.invoiceDate || data.invoice_date || "",
      invoice_time: data.invoiceTime || data.invoice_time || "",
      cashier_id: data.cashierId || data.cashier_id || "",
      cashier_name: data.cashierName || data.cashier_name || "",
      tax_date: data.taxDate || data.tax_date || "",
      page_no: data.pageNo || data.page_no || "1",

      // Reference IDs
      accommodation_ref_id: data.accommodationRefId || "",
      services_ref_id: data.servicesRefId || "",
      starting_ref_no: data.startingRefNo || "",

      // Bank & Payment
      bank_name: data.bankName || data.bank_name || "",
      account_number: data.accountNumber || data.account_number || "",
      sort_code: data.sortCode || data.sort_code || "",
      swift_code: data.swiftCode || data.swift_code || "",
      iban_code: data.ibanCode || data.iban_code || "",
      account_holder: data.accountHolder || data.account_holder || "",

      // Status
      currency: "GBP",
      status: data.status || "pending",
      note: data.note || "",
      accommodation_details: accommodationDetails,
      other_services: otherServices,
    };
  };

  // ── Initialize empty form ─────────────────────────────────────────────────
  const initializeFormData = (config) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const initialData = {
      hotel_name: config.hotel_name,
      currency: "GBP",
      status: "pending",
      note: "",
      invoice_time: `${hh}:${mm}`,
    };

    config.form_fields?.forEach((field) => {
      if (field.field_id !== "invoice_time") {
        initialData[field.field_id] = "";
      }
    });

    Object.entries(config.conditional_sections || {}).forEach(
      ([sectionKey, section]) => {
        if (section.enabled) {
          initialData[sectionKey] = section.multiple_entries ? [] : {};
        }
      }
    );
    setFormData(initialData);
  };

  // ── Field Change Handler ──────────────────────────────────────────────────
  const handleFieldChange = (fieldPath, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const parts = fieldPath.split(".");
      if (parts.length === 1) {
        newData[parts[0]] = value;
      } else {
        if (!newData[parts[0]]) newData[parts[0]] = {};
        newData[parts[0]][parts[1]] = value;
      }
      return newData;
    });
  };

  // ── Save Handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (
      dateError ||
      !formData.arrival_date ||
      !formData.departure_date ||
      !formData.guest_name
    ) {
      toast.error("Please fix validation errors before saving", {
        position: "top-center",
      });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Saving invoice...", {
      position: "top-center",
    });

    try {
      const invoicePayload = mapToUKBackendSchema(formData, hotelConfig);
      console.log("this is invoice payload",  invoicePayload);
      

      if (isEditMode) {
        await UKInvoiceApi.updateInvoice(invoiceId, invoicePayload);
      } else {
        await UKInvoiceApi.createInvoice(invoicePayload);
      }

      toast.dismiss(loadingToast);

      setSavedInvoiceData({
        isEdit: isEditMode,
        invoiceNumber: formData.guest_name || "NEW",
        status: formData.status,
        grandTotal: summary?.grand_total_gbp || 0,
        currency: "GBP",
      });

      setTimeout(() => {
        const modalElement = document.getElementById("success_modal");
        if (modalElement) {
          modalElement.showModal();
        } else {
          toast.success("Invoice saved successfully!");
          navigate("/invoices");
        }
      }, 100);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to save invoice", { duration: 6000 });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[#1a1a2e]" />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6 text-red-600">
        Error: {error}
      </div>
    );
  if (!hotelConfig) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate("/invoices")}
              className="flex items-center gap-2 text-slate-600 mb-4"
            >
              <ArrowLeft size={20} /> Back
            </button>
            <h1 className="text-xl md:text-2xl font-bold">
              {isEditMode ? "Edit Invoice" : "Create New Invoice"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {hotelConfig.hotel_name}{" "}
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded ml-1">
                🇬🇧 UK
              </span>
            </p>
          </div>
        </div>

        {/* Date Error */}
        {dateError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 font-medium text-sm">{dateError}</p>
          </div>
        )}

        {/* Duplicate Warning */}
        {isDuplicateMode && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-purple-800 font-medium text-sm">
              You are creating a duplicate. Please update the reference number
              before saving to avoid conflicts.
            </p>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-4 md:space-y-6">
          <DynamicFormSection
            title="Invoice Information"
            fields={hotelConfig.form_fields || []}
            formData={formData}
            onFieldChange={handleFieldChange}
          />

          {Object.entries(hotelConfig.conditional_sections || {}).map(
            ([sectionKey, section]) => {
              if (!section.enabled) return null;
              return (
                <UKConditionalSection
                  key={sectionKey}
                  sectionKey={sectionKey}
                  section={section}
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  setFormData={setFormData}
                  hotelConfig={hotelConfig}
                />
              );
            }
          )}

          <UKSummarySection
            config={hotelConfig}
            formData={formData}
            summary={summary}
            onStatusChange={(val) => handleFieldChange("status", val)}
            onNoteChange={(val) => handleFieldChange("note", val)}
          />
        </div>

        {/* Fixed Bottom Save Bar */}
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
                  {isDuplicateMode
                    ? "Creating Duplicate..."
                    : isEditMode
                    ? "Updating..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isDuplicateMode
                    ? "Create Duplicate"
                    : isEditMode
                    ? "Update Invoice"
                    : "Save Invoice"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
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