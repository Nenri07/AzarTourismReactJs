"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";

// APIs
import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
import MalaysiaInvoiceApi from "../Api/malaysiaInvoice.api";

// Shared UI components
import { DynamicFormSection, SuccessModal, MalaysiaConditionalSection, MalaysiaSummarySection } from '../components';

// Dedicated Math
import { calculateFinalSummary, mapToBackendSchema, detectHotelType } from "../utils/invoiceCalculationsMalaysia";

export default function DynamicInvoiceFormPageMalaysia() {
  const navigate = useNavigate();
  const params = useParams();

  const isDuplicateMode = window.location.pathname.includes('/duplicate/');
  const isEditMode = Boolean(params.invoiceId && !params.hotelId && !isDuplicateMode);
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

  // DATE VALIDATOR
  useEffect(() => {
    if (!formData.arrival_date || !formData.departure_date) return;

    const arrival = new Date(formData.arrival_date);
    const departure = new Date(formData.departure_date);

    if (departure <= arrival) {
      setDateError("Departure date must be after arrival date");
      if (formData.accommodation_details?.total_nights) {
        setFormData(prev => ({ ...prev, accommodation_details: { ...prev.accommodation_details, total_nights: 0 } }));
      }
      return;
    }

    setDateError("");
    const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

    if (formData.accommodation_details) {
      setFormData(prev => ({ ...prev, accommodation_details: { ...prev.accommodation_details, total_nights: diffDays } }));
    }
  }, [formData.arrival_date, formData.departure_date]);

  useEffect(() => {
    if (hotelConfig && formData.accommodation_details) {
      try {
        const hotelType = detectHotelType(hotelConfig);
        const newSummary = calculateFinalSummary(formData, hotelType);
        setSummary(newSummary);
      } catch (err) {
        console.error("Error calculating summary:", err);
      }
    }
  }, [formData.accommodation_details, formData.other_services, hotelConfig]);

  const loadInvoiceAndConfig = async () => {
    setLoading(true); setError(null);
    try {
      // FIXED: Using MalaysiaInvoiceApi instead of cairoInvoiceApi
      const invoiceResponse = await MalaysiaInvoiceApi.getInvoiceById(invoiceId);
      let invoiceData = invoiceResponse.data || invoiceResponse;
      if (invoiceData.data?.data) invoiceData.data = invoiceData.data.data;

      const data = invoiceData.data || invoiceData;
      const hotelName = data.hotel_name || data.hotel || "";

      const allConfigsResponse = await getHotelConfigs();
      const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      let loadedConfig = allConfigs.find(config => config.hotel_name === hotelName) || allConfigs[0];

      if (!loadedConfig) throw new Error(`No hotel configuration found`);

      setHotelConfig(loadedConfig);
      setFormData(mapInvoiceToForm(invoiceData, loadedConfig));
      toast.success(isDuplicateMode ? "Invoice loaded for duplication" : "Invoice loaded successfully", { duration: 2000 });
    } catch (err) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const loadHotelConfig = async (hotelId) => {
    setLoading(true); setError(null);
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

  const mapInvoiceToForm = (invoiceData, hotelConfig) => {
    let data = invoiceData;
    if (data?.data) data = data.data;
    if (data?.data) data = data.data;

    const accConfig = hotelConfig?.conditional_sections?.accommodation_details;
    const servicesConfig = hotelConfig?.conditional_sections?.other_services;
    const accommodationDetails = {};

    // Map existing Accommodation Details + The Single Night Breakdown Math
    if (accConfig?.fields) {
      accConfig.fields.forEach(field => {
        const fieldId = field.field_id;
        const nightData = data.accommodationDetails?.[0] || {};

        if (fieldId === 'usd_amount') accommodationDetails[fieldId] = data.usdAmount || data.usd_amount || '';
        else if (fieldId === 'exchange_rate') accommodationDetails[fieldId] = data.exchangeRate || data.exchange_rate || '';
        else if (fieldId === 'total_nights') accommodationDetails[fieldId] = data.nights || data.total_nights || '';
        // FIXED - reads from the actual API response keys
        else if (fieldId === 'nightly_base_myr') accommodationDetails[fieldId] = data.roombaseAmount || '';
        else if (fieldId === 'nightly_sst_myr') accommodationDetails[fieldId] = data.roomSST || '';
        else if (fieldId === 'nightly_tourism_tax_myr') accommodationDetails[fieldId] = data.tourismTax || '';
        else if (fieldId === 'room_amount_myr') accommodationDetails[fieldId] = data.totalNightGrossMyr || '';
        else if (fieldId === 'total_room_all_nights') accommodationDetails[fieldId] = data.totalRoomGrossMyr || '';
        else accommodationDetails[fieldId] = data[fieldId] !== undefined ? data[fieldId] : '';
      });
    }

    const otherServices = [];
    if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
      data.otherServices.forEach(service => {
        const mappedService = { id: Date.now() + Math.random() };
        servicesConfig.fields.forEach(field => {
          const fieldId = field.field_id;
          if (fieldId === 'service_name') mappedService[fieldId] = service.name || '';
          else if (fieldId === 'service_date') mappedService[fieldId] = service.date || '';
          else if (fieldId === 'gross_amount') mappedService[fieldId] = service.amount || '';
          else mappedService[fieldId] = service[fieldId] || '';
        });
        otherServices.push(mappedService);
      });
    }

return {
      // -----------------------------------------------------
      // REPLACED: ALL MALAYSIAN HOTEL FIELDS MAPPED HERE
      // -----------------------------------------------------
      
      // Hotel / Property Information
      reference_no: data.referenceNo,
      hotel_name: data.hotel_name || data.hotel || hotelConfig?.hotel_name || '',
      company_reg_no: data.company_reg_no || data.companyRegNo || '',
      sst_reg_no: data.sst_reg_no || data.sstRegNo || '',
      ttx_reg_no: data.ttx_reg_no || data.ttxRegNo || '',
      tin_no: data.tin_no || data.tinNo || '',
      hotel_address: data.hotel_address || '',
      hotel_phone: data.hotel_phone || data.hotelPhone || '',
      hotel_fax: data.hotel_fax || data.hotelFax || '',
      hotel_email: data.hotel_email || data.hotelEmail || '',

      // Guest & Client Information
      guest_name: data.guest_name || data.guestName || data.attention || '',
      company_name: data.company_name || data.companyName || data.agent || '',
      address: data.address || '',
      nationality: data.nationality || '',
      guest_phone: data.guestPhone || data.hotelPhone || data.hotel_phone || '',
      guest_email: data.guestEmail || data.hotelEmail || data.hotel_email || data.email || '',
      membership_no: data.membership_no || data.membershipNo || '',
      adults: String(data.adults || data.paxAdult || 1),
      children: String(data.children || data.paxChild || 0),
      account_contact: data.account_contact || '',

      // Stay & Reservation Details
      room_number: data.room_number || data.roomNo || '',
      room_type: data.room_type || data.roomType || '',
      arrival_date: data.arrival_date || data.arrivalDate || '',
      arrival_time: data.arrival_time || '',
      departure_date: data.departure_date || data.departureDate || '',
      departure_time: data.departure_time || '',
      conf_no: data.conf_no || data.confNo || data.booking_no || data.reservation_no || '',
      group_code: data.group_code || data.ta_code || '',
      crs_no: data.crsNo || data.ota_no || '',
     
      


      // Invoice Metadata
      invoice_no: data.invoice_no || data.invoiceNo || '',
      folio_no: data.folio_no || data.e_invoice_no || '',
      ar_number: data.ar_number || data.arNumber || '',
      po_no: data.poNo || data.job_no || data.reference_no || '',
      third_party_no: data.third_party_no || data.thirdPartyNo || '',
      vessel_name: data.vesselName || data.vesselName || '',
      booker_name: data.bookerName || data.bookerName || '',
      invoice_date: data.invoice_date || data.invoiceDate || '',
      invoice_time: data.invoice_time || data.invoiceTime || '',
      cashier_id: data.cashier_id || data.cashierId || data.cashier || data.userId || '',
      cashier_name: data.cashierName || data.cashier_name || '',
      uuid: data.uuid || '',

      // Bank & Payment Details
      bank_name: data.bank_name || '',
      account_number: data.account_number || '',
      bank_code: data.bank_code || '',
      branch_code: data.branch_code || '',
      swift_code: data.swift_code || '',
      account_holder: data.account_holder || '',
      bank_address: data.bank_address || '',

      // Base Configs & Defaults
      currency: hotelConfig?.currency || 'MYR',
      status: data.status || 'pending',
      note: data.note || '',
      accommodation_details: accommodationDetails,
      other_services: otherServices
    };
  };

  const initializeFormData = (config) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const initialData = {
      hotel_name: config.hotel_name,
      currency: config.currency || 'MYR',
      status: "pending",
      note: "",
      invoice_time: `${hh}:${mm}`
    };

    config.form_fields?.forEach(field => {
      if (field.field_id !== 'invoice_time') {
        initialData[field.field_id] = "";
      }
    });

    Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
      if (section.enabled) {
        initialData[sectionKey] = section.multiple_entries ? [] : {};
      }
    });
    setFormData(initialData);
  };

  const handleFieldChange = (fieldPath, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = fieldPath.split('.');
      if (parts.length === 1) newData[parts[0]] = value;
      else {
        if (!newData[parts[0]]) newData[parts[0]] = {};
        newData[parts[0]][parts[1]] = value;
      }
      return newData;
    });
  };

  const handleSave = async () => {
    if (dateError || !formData.arrival_date || !formData.departure_date || !formData.guest_name) {
      toast.error("Please fix validation errors before saving", { position: "top-center" });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Saving invoice...", { position: "top-center" });

    try {
      const invoicePayload = mapToBackendSchema(formData, hotelConfig);

      // FIXED: Using MalaysiaInvoiceApi instead of cairoInvoiceApi
      if (isEditMode) {
        await MalaysiaInvoiceApi.updateInvoice(invoiceId, invoicePayload);
      } else {
        await MalaysiaInvoiceApi.createInvoice(invoicePayload);
      }

      toast.dismiss(loadingToast);

      setSavedInvoiceData({
        isEdit: isEditMode,
        invoiceNumber: formData.company_name || 'NEW',
        status: formData.status,
        grandTotal: summary?.grand_total || 0,
        currency: hotelConfig.currency || 'MYR'
      });

      setTimeout(() => {
        const modalElement = document.getElementById('success_modal');
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

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 size={48} className="animate-spin text-[#003d7a]" /></div>;
  if (error) return <div className="min-h-screen bg-[#f8fafc] p-6 text-red-600">Error: {error}</div>;
  if (!hotelConfig) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
        <div className="mb-6 md:mb-8 flex justify-between items-center">
          <div>
            <button onClick={() => navigate("/invoices")} className="flex items-center gap-2 text-slate-600 mb-4"><ArrowLeft size={20} /> Back</button>
            <h1 className="text-xl md:text-2xl font-bold">{isEditMode ? "Edit Invoice" : "Create New Invoice"}</h1>
            <p className="text-slate-500 text-sm mt-1">{hotelConfig.hotel_name}</p>
          </div>
        </div>

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

        <div className="space-y-4 md:space-y-6">
          <DynamicFormSection title="Invoice Information" fields={hotelConfig.form_fields || []} formData={formData} onFieldChange={handleFieldChange} />

          {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
            if (!section.enabled) return null;
            return <MalaysiaConditionalSection key={sectionKey} sectionKey={sectionKey} section={section} formData={formData} onFieldChange={handleFieldChange} setFormData={setFormData} hotelConfig={hotelConfig} />;
          })}

          <MalaysiaSummarySection config={hotelConfig} formData={formData} summary={summary} onStatusChange={(val) => handleFieldChange('status', val)} onNoteChange={(val) => handleFieldChange('note', val)} />
        </div>

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
              className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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