"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
import toast from "react-hot-toast";
import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
import {
  DynamicConditionalSection,
  DynamicFormSection,
  DynamicSummarySection,
  SuccessModal
} from '../components';
import { detectHotelType, mapToBackendSchema, calculateFinalSummary } from "../utils/invoiceCalculations";

export default function DynamicInvoiceFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  
  // Determine mode based on route
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

  // Load invoice or hotel config on mount
  useEffect(() => {
    if ((isEditMode || isDuplicateMode) && invoiceId) {
      loadInvoiceAndConfig();
    } else if (hotelIdFromRoute) {
      loadHotelConfig(hotelIdFromRoute);
    }
  }, [isEditMode, isDuplicateMode, invoiceId, hotelIdFromRoute]);

  // Auto-calculate nights from dates
  useEffect(() => {
    if (!formData.arrival_date || !formData.departure_date) return;

    const arrival = new Date(formData.arrival_date);
    const departure = new Date(formData.departure_date);
    
    if (departure <= arrival) {
      setDateError("Departure date must be after arrival date");
      if (formData.accommodation_details?.total_nights) {
        setFormData(prev => ({
          ...prev,
          accommodation_details: {
            ...prev.accommodation_details,
            total_nights: 0
          }
        }));
      }
      return;
    }
    
    setDateError("");
    const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

    if (formData.accommodation_details) {
      setFormData(prev => ({
        ...prev,
        accommodation_details: {
          ...prev.accommodation_details,
          total_nights: diffDays
        }
      }));
    }
  }, [formData.arrival_date, formData.departure_date]);

  const loadInvoiceAndConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      let invoiceData = invoiceResponse.data || invoiceResponse;
      
      // Handle nested data structure
      if (invoiceData.data?.data) {
        invoiceData.data = invoiceData.data.data;
      }

      const data = invoiceData.data || invoiceData;
      const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";
      
      // Get all hotel configs
      const allConfigsResponse = await getHotelConfigs();
      const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      
      let hotelConfig = allConfigs.find(config => config.hotel_name === hotelName);
      
      if (!hotelConfig && allConfigs.length > 0) {
        hotelConfig = allConfigs[0];
      }
      
      if (!hotelConfig) {
        throw new Error(`No hotel configuration found`);
      }
      
      setHotelConfig(hotelConfig);
      
      // Map invoice data to form
      const mappedData = mapInvoiceToForm(invoiceData, hotelConfig);
      setFormData(mappedData);
      
      toast.success(
        isDuplicateMode 
          ? "Invoice loaded for duplication" 
          : "Invoice loaded successfully", 
        {
          duration: 2000,
          icon: isDuplicateMode ? "📋" : "📄"
        }
      );
    } catch (err) {
      setError(err.message || "Failed to load invoice");
      toast.error(err.message || "Failed to load invoice", {
        duration: 4000
      });
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
      
      toast.success("Hotel configuration loaded", {
        duration: 2000,
        icon: "🏨"
      });
    } catch (err) {
      setError(err.message || "Failed to load hotel configuration");
      toast.error(err.message || "Failed to load hotel configuration", {
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const mapInvoiceToForm = (invoiceData, hotelConfig) => {
    // Extract data from nested structure
    let data = invoiceData;
    if (data?.data) data = data.data;
    if (data?.data) data = data.data;
    
    const hotelType = detectHotelType(hotelConfig);
    const isGrandAras = hotelType === 'GRAND_ARAS';
    
    const accommodationConfig = hotelConfig?.conditional_sections?.accommodation_details;
    const servicesConfig = hotelConfig?.conditional_sections?.other_services;
    
    // Build accommodation details dynamically based on config
    const accommodationDetails = {};
    
    if (accommodationConfig?.fields) {
      accommodationConfig.fields.forEach(field => {
        const fieldId = field.field_id;
        let value = null;
        
        // Try direct match first
        if (data[fieldId] !== undefined) {
          value = data[fieldId];
        }
        // Common field aliases
        else if (fieldId === 'eur_amount' && data.actualRate !== undefined) {
          value = data.actualRate;
        }
        else if (fieldId === 'exchange_rate' && data.exchangeRate !== undefined) {
          value = data.exchangeRate;
        }
        else if (fieldId === 'total_nights' && data.nights !== undefined) {
          value = data.nights;
        }
        // Grand Aras specific fields
        else if (fieldId === 'room_amount_try') {
          value = data.room_amount_try || data.sellingRate;
        }
        else if (fieldId === 'total_room_all_nights') {
          value = data.total_room_all_nights || data.subTotal;
        }
        else if (fieldId === 'taxable_amount_room') {
          value = data.taxable_amount_room || data.taxable_amount;
        }
        else if (fieldId === 'vat_10_percent') {
          value = data.vat_10_percent || data.vat1_10;
        }
        else if (fieldId === 'accommodation_tax') {
          value = data.accommodation_tax || data.accommodationTaxTotal;
        }
        // CVK specific fields
        else if (fieldId === 'taxable_amount') {
          value = data.taxable_amount || data.sellingRate;
        }
        else if (fieldId === 'total_per_night') {
          value = data.total_per_night || data.subTotal;
        }
        else if (fieldId === 'vat_total_nights') {
          value = data.vat_total_nights || data.vat7;
        }
        else if (fieldId === 'acc_tax_total_nights') {
          value = data.acc_tax_total_nights || data.accommodationTaxTotal;
        }
        
        accommodationDetails[fieldId] = value !== null ? value : '';
      });
    }
    
    // Build services array dynamically based on config
    const otherServices = [];
    
    if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
      data.otherServices.forEach(service => {
        const mappedService = { id: Date.now() + Math.random() };
        
        servicesConfig.fields.forEach(field => {
          const fieldId = field.field_id;
          
          if (fieldId === 'service_name' && service.name !== undefined) {
            mappedService[fieldId] = service.name;
          }
          else if (fieldId === 'service_date' && service.date !== undefined) {
            mappedService[fieldId] = service.date;
          }
          else if (fieldId === 'gross_amount' && service.amount !== undefined) {
            mappedService[fieldId] = service.amount;
          }
          else if (fieldId === 'taxable_amount' && service.taxable_amount !== undefined) {
            mappedService[fieldId] = service.taxable_amount;
          }
          else if (fieldId === 'vat_20_percent' && service.vat_20_percent !== undefined) {
            mappedService[fieldId] = service.vat_20_percent;
          }
          else if (service[fieldId] !== undefined) {
            mappedService[fieldId] = service[fieldId];
          }
          else {
            mappedService[fieldId] = '';
          }
        });
        
        otherServices.push(mappedService);
      });
    }
    
    return {
      hotel_name: data.hotel || hotelConfig?.hotel_name || '',
      currency: hotelConfig?.currency || 'TRY',
      company_name: data.referenceNo || data.company_name || '',
      guest_name: data.guestName || '',
      arrival_date: data.arrivalDate || '',
      departure_date: data.departureDate || '',
      v_d: data.vd || '',
      v_no: data.vNo || '',
      folio_number: data.folioNumber || data.folio_number || '',
      voucher_no: data.voucherNo || '',
      invoice_date: data.invoiceDate || '',
      room_number: data.roomNo || '',
      adults: String(data.paxAdult || 1),
      children: String(data.paxChild || 0),
      passport_no: data.passportNo || '',
      user_code: data.userId || '',
      cash_no: data.batchNo || '',
      page_number: data.batchNo || '',
      accommodation_details: accommodationDetails,
      other_services: otherServices,
      status: data.status || 'pending',
      note: data.note || ''
    };
  };

  const initializeFormData = (config) => {
    const initialData = {
      hotel_name: config.hotel_name,
      currency: config.currency,
      status: "pending",
      note: ""
    };

    // Initialize form fields
    config.form_fields?.forEach(field => {
      initialData[field.field_id] = "";
    });

    // Initialize conditional sections
    Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
      if (section.enabled) {
        initialData[sectionKey] = {};
        
        section.fields?.forEach(field => {
          initialData[sectionKey][field.field_id] = field.fixed_value || "";
        });

        if (section.multiple_entries) {
          initialData[sectionKey] = [];
        }
      }
    });

    setFormData(initialData);
  };

  const handleFieldChange = (fieldPath, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = fieldPath.split('.');
      
      if (parts.length === 1) {
        newData[parts[0]] = value;
      } else if (parts.length === 2) {
        if (!newData[parts[0]]) {
          newData[parts[0]] = {};
        }
        newData[parts[0]][parts[1]] = value;
      }
      
      return newData;
    });
  };

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus
    }));
    
    toast.success(`Status: ${newStatus}`, {
      duration: 2000,
      position: "bottom-right",
      icon: newStatus === "ready" ? "✅" : "⏳"
    });
  };

  const handleNoteChange = (newNote) => {
    setFormData(prev => ({
      ...prev,
      note: newNote
    }));
  };

  const handleSave = async () => {
    if (dateError) {
      toast.error("Please fix date errors before saving", { 
        duration: 3000, 
        position: "top-center" 
      });
      return;
    }

    if (!formData.arrival_date || !formData.departure_date) {
      toast.error("Please select arrival and departure dates", { 
        duration: 3000, 
        position: "top-center" 
      });
      return;
    }

    if (!formData.guest_name) {
      toast.error("Guest name is required", { 
        duration: 3000, 
        position: "top-center" 
      });
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading(
      isDuplicateMode 
        ? "Creating duplicate invoice..." 
        : isEditMode 
          ? "Updating invoice..." 
          : "Creating invoice...",
      { position: "top-center" }
    );
    
    try {
      console.log("💾 Saving invoice with formData:", formData);
      
      // Use centralized mapping function
      const hotelType = detectHotelType(hotelConfig);
      const invoicePayload = mapToBackendSchema(formData, hotelConfig);
      
      console.log("📤 Backend payload:", invoicePayload);
      
      // Calculate summary for modal display
      const summary = calculateFinalSummary(formData, hotelType);
      
      let response;
      if (isEditMode) {
        response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
      } else {
        // For both create and duplicate modes, we create a new invoice
        response = await turkeyInvoiceApi.createInvoice(invoicePayload);
      }
      
      toast.dismiss(loadingToast);
      
      setSavedInvoiceData({
        isEdit: isEditMode,
        invoiceNumber: formData.company_name || (isEditMode ? invoiceId.substring(0, 8) : 'NEW'),
        status: formData.status,
        grandTotal: summary.grand_total,
        currency: hotelConfig.currency
      });
      
      setTimeout(() => {
        const modalElement = document.getElementById('success_modal');
        if (modalElement) {
          modalElement.showModal();
        } else {
          toast.success("Invoice saved successfully!", { duration: 2000 });
          setTimeout(() => navigate("/invoices"), 1500);
        }
      }, 100);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      
      let errorMessage = "Failed to save invoice";
      
      // Check for duplicate reference number error (400 status)
      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail;
        
        // Check if error message contains reference to duplicate or reference number
        if (detail && (
          detail.toLowerCase().includes('duplicate') ||
          detail.toLowerCase().includes('reference') ||
          detail.toLowerCase().includes('already exists')
        )) {
          errorMessage = "Reference number already exists. Please use a different reference number.";
          
          // Highlight the company_name field
          toast.error(errorMessage, { 
            duration: 6000, 
            position: "top-center",
            icon: "⚠️"
          });
          
          // Scroll to the reference number field
          setTimeout(() => {
            const refField = document.querySelector('[name="company_name"]');
            if (refField) {
              refField.scrollIntoView({ behavior: 'smooth', block: 'center' });
              refField.focus();
            }
          }, 500);
          
          setIsSaving(false);
          return;
        }
      }
      
      // Handle other validation errors
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { 
        duration: 6000, 
        position: "top-center" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    navigate("/invoices");
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
      navigate("/invoices");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
          <p className="text-slate-600 text-lg">
            {isDuplicateMode 
              ? "Loading invoice to duplicate..." 
              : isEditMode 
                ? "Loading invoice..." 
                : "Loading hotel configuration..."}
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate("/invoices")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Invoices</span>
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            {isDuplicateMode 
              ? "Duplicate Invoice" 
              : isEditMode 
                ? "Edit Invoice" 
                : "Create New Invoice"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
            {(hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {hotelType === 'TRYP' ? 'TRYP Mode' : 'Grand Aras Mode'}
              </span>
            )}
            {isDuplicateMode && (
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Duplicate Mode
              </span>
            )}
          </p>
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
          <DynamicFormSection
            title="Invoice Information"
            fields={hotelConfig.form_fields || []}
            formData={formData}
            onFieldChange={handleFieldChange}
            dateError={dateError}
          />

          {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
            if (!section.enabled) return null;

            return (
              <DynamicConditionalSection
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

          <DynamicSummarySection
            config={hotelConfig}
            formData={formData}
            onStatusChange={handleStatusChange}
            onNoteChange={handleNoteChange}
          />
        </div>

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
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
