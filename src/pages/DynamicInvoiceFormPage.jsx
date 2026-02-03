// DynamicInvoiceFormPage.jsx  100% working code with centralized mapping function
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
  
  const isEditMode = Boolean(params.invoiceId && !params.hotelId);
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
    if (isEditMode && invoiceId) {
      loadInvoiceAndConfig();
    } else if (hotelIdFromRoute) {
      loadHotelConfig(hotelIdFromRoute);
    }
  }, [isEditMode, invoiceId, hotelIdFromRoute]);

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
      
      toast.success("Invoice loaded successfully", {
        duration: 2000,
        icon: "📄"
      });
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
      v_d: data.vd || '', // V.D field (Grand Aras)
      v_no: data.vNo || '', // V.NO field (Grand Aras)
      folio_number: data.folioNumber || data.folio_number || '', // ✅ FIXED: read from folioNumber (camelCase)
      voucher_no: data.voucherNo || '', // Voucher No
      invoice_date: data.invoiceDate || '',
      room_number: data.roomNo || '',
      adults: String(data.paxAdult || 1),
      children: String(data.paxChild || 0),
      passport_no: data.passportNo || '',
      user_code: data.userId || '',
      cash_no: data.batchNo || '', // Cash No from batchNo
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
      isEditMode ? "Updating invoice..." : "Creating invoice...",
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
            {isEditMode ? "Loading invoice..." : "Loading hotel configuration..."}
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
            {isEditMode ? "Edit Invoice" : "Create New Invoice"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
            {(hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {hotelType === 'TRYP' ? 'TRYP Mode' : 'Grand Aras Mode'}
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
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditMode ? "Update Invoice" : "Save Invoice"}
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








//////lastly pured without h
// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
// import toast from "react-hot-toast";
// import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
// import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// import {
//   DynamicConditionalSection,
//   DynamicFormSection,
//   DynamicSummarySection,
//   SuccessModal
// } from '../components';

// export default function DynamicInvoiceFormPage() {
//   const navigate = useNavigate();
//   const params = useParams();
  
//   const isEditMode = Boolean(params.invoiceId && !params.hotelId);
//   const invoiceId = params.invoiceId;
//   const hotelIdFromRoute = params.hotelId;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hotelConfig, setHotelConfig] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [dateError, setDateError] = useState("");
//   const [formData, setFormData] = useState({});
//   const [savedInvoiceData, setSavedInvoiceData] = useState(null);

//   // Load invoice or hotel config on mount
//   useEffect(() => {
//     if (isEditMode && invoiceId) {
//       loadInvoiceAndConfig();
//     } else if (hotelIdFromRoute) {
//       loadHotelConfig(hotelIdFromRoute);
//     }
//   }, [isEditMode, invoiceId, hotelIdFromRoute]);

//   // Auto-calculate nights from dates
//   useEffect(() => {
//     if (!formData.arrival_date || !formData.departure_date) return;

//     const arrival = new Date(formData.arrival_date);
//     const departure = new Date(formData.departure_date);
    
//     if (departure <= arrival) {
//       setDateError("Departure date must be after arrival date");
//       if (formData.accommodation_details?.total_nights) {
//         setFormData(prev => ({
//           ...prev,
//           accommodation_details: {
//             ...prev.accommodation_details,
//             total_nights: 0
//           }
//         }));
//       }
//       return;
//     }
    
//     setDateError("");
//     const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

//     if (formData.accommodation_details) {
//       setFormData(prev => ({
//         ...prev,
//         accommodation_details: {
//           ...prev.accommodation_details,
//           total_nights: diffDays
//         }
//       }));
//     }
//   }, [formData.arrival_date, formData.departure_date]);

//   const loadInvoiceAndConfig = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
//       let invoiceData = invoiceResponse.data || invoiceResponse;
      
//       // Handle nested data structure
//       if (invoiceData.data?.data) {
//         invoiceData.data = invoiceData.data.data;
//       }

//       const data = invoiceData.data || invoiceData;
//       const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";
      
//       // Get all hotel configs
//       const allConfigsResponse = await getHotelConfigs();
//       const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      
//       let hotelConfig = allConfigs.find(config => config.hotel_name === hotelName);
      
//       if (!hotelConfig && allConfigs.length > 0) {
//         hotelConfig = allConfigs[0];
//       }
      
//       if (!hotelConfig) {
//         throw new Error(`No hotel configuration found`);
//       }
      
//       setHotelConfig(hotelConfig);
      
//       // Map invoice data to form
//       const mappedData = mapInvoiceToForm(invoiceData, hotelConfig);
//       setFormData(mappedData);
      
//       toast.success("Invoice loaded successfully", {
//         duration: 2000,
//         icon: "📄"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load invoice");
//       toast.error(err.message || "Failed to load invoice", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadHotelConfig = async (hotelId) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await getHotelConfigById(hotelId);
//       setHotelConfig(response);
//       initializeFormData(response);
      
//       toast.success("Hotel configuration loaded", {
//         duration: 2000,
//         icon: "🏨"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load hotel configuration");
//       toast.error(err.message || "Failed to load hotel configuration", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const mapInvoiceToForm = (invoiceData, hotelConfig) => {
//     // Extract data from nested structure
//     let data = invoiceData;
//     if (data?.data) data = data.data;
//     if (data?.data) data = data.data;
    
//     const accommodationConfig = hotelConfig?.conditional_sections?.accommodation_details;
//     const servicesConfig = hotelConfig?.conditional_sections?.other_services;
    
//     // Build accommodation details dynamically based on config
//     const accommodationDetails = {};
    
//     if (accommodationConfig?.fields) {
//       accommodationConfig.fields.forEach(field => {
//         const fieldId = field.field_id;
//         let value = null;
        
//         // Try direct match first
//         if (data[fieldId] !== undefined) {
//           value = data[fieldId];
//         }
//         // Common field aliases
//         else if (fieldId === 'eur_amount' && data.actualRate !== undefined) {
//           value = data.actualRate;
//         }
//         else if (fieldId === 'exchange_rate' && data.exchangeRate !== undefined) {
//           value = data.exchangeRate;
//         }
//         else if (fieldId === 'total_nights' && data.nights !== undefined) {
//           value = data.nights;
//         }
//         // Grand Aras specific fields
//         else if (fieldId === 'room_amount_try' && data.sellingRate !== undefined) {
//           value = data.sellingRate;
//         }
//         else if (fieldId === 'total_room_all_nights' && data.subTotal !== undefined) {
//           value = data.subTotal;
//         }
//         else if (fieldId === 'taxable_amount_room') {
//           value = data.taxable_amount_room || data.taxable_amount;
//         }
//         else if (fieldId === 'vat_10_percent') {
//           value = data.vat_10_percent || data.vat1_10;
//         }
//         else if (fieldId === 'accommodation_tax') {
//           value = data.accommodation_tax || data.accommodationTaxTotal;
//         }
//         // CVK specific fields
//         else if (fieldId === 'taxable_amount') {
//           value = data.taxable_amount || data.taxable_amount_room;
//         }
//         else if (fieldId === 'total_per_night') {
//           value = data.total_per_night || data.subTotal;
//         }
//         else if (fieldId === 'vat_total_nights') {
//           value = data.vat_total_nights || data.vatTotal;
//         }
//         else if (fieldId === 'acc_tax_total_nights') {
//           value = data.acc_tax_total_nights || data.accommodationTaxTotal;
//         }
        
//         accommodationDetails[fieldId] = value !== null ? value : '';
//       });
//     }
    
//     // Build services array dynamically based on config
//     const otherServices = [];
    
//     if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
//       data.otherServices.forEach(service => {
//         const mappedService = {};
        
//         servicesConfig.fields.forEach(field => {
//           const fieldId = field.field_id;
          
//           if (fieldId === 'service_name' && service.name !== undefined) {
//             mappedService[fieldId] = service.name;
//           }
//           else if (fieldId === 'service_date' && service.date !== undefined) {
//             mappedService[fieldId] = service.date;
//           }
//           else if (fieldId === 'gross_amount' && service.amount !== undefined) {
//             mappedService[fieldId] = service.amount;
//           }
//           else if (fieldId === 'taxable_amount' && service.taxable_amount !== undefined) {
//             mappedService[fieldId] = service.taxable_amount;
//           }
//           else if (fieldId === 'vat_20_percent' && service.vat_20_percent !== undefined) {
//             mappedService[fieldId] = service.vat_20_percent;
//           }
//           else if (service[fieldId] !== undefined) {
//             mappedService[fieldId] = service[fieldId];
//           }
//           else {
//             mappedService[fieldId] = '';
//           }
//         });
        
//         otherServices.push(mappedService);
//       });
//     }
    
//     return {
//       hotel_name: data.hotel || hotelConfig?.hotel_name || '',
//       currency: hotelConfig?.currency || 'TRY',
//       company_name: data.referenceNo || data.company_name || '',
//       guest_name: data.guestName || '',
//       arrival_date: data.arrivalDate || '',
//       departure_date: data.departureDate || '',
//       folio_number: data.vNo || data.folio_number || '',
//       invoice_date: data.invoiceDate || '',
//       room_number: data.roomNo || '',
//       adults: String(data.paxAdult || 1),
//       children: String(data.paxChild || 0),
//       passport_no: data.passportNo || '',
//       user_code: data.userId || '',
//       cash_no: data.voucherNo || '',
//       page_number: data.batchNo || '',
//       accommodation_details: accommodationDetails,
//       other_services: otherServices,
//       status: data.status || 'pending',
//       note: data.note || ''
//     };
//   };

//   const initializeFormData = (config) => {
//     const initialData = {
//       hotel_name: config.hotel_name,
//       currency: config.currency,
//       status: "pending",
//       note: ""
//     };

//     // Initialize form fields
//     config.form_fields?.forEach(field => {
//       initialData[field.field_id] = "";
//     });

//     // Initialize conditional sections
//     Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
//       if (section.enabled) {
//         initialData[sectionKey] = {};
        
//         section.fields?.forEach(field => {
//           initialData[sectionKey][field.field_id] = field.fixed_value || "";
//         });

//         if (section.multiple_entries) {
//           initialData[sectionKey] = [];
//         }
//       }
//     });

//     setFormData(initialData);
//   };

//   const handleFieldChange = (fieldPath, value) => {
//     setFormData(prev => {
//       const newData = { ...prev };
//       const parts = fieldPath.split('.');
      
//       if (parts.length === 1) {
//         newData[parts[0]] = value;
//       } else if (parts.length === 2) {
//         if (!newData[parts[0]]) {
//           newData[parts[0]] = {};
//         }
//         newData[parts[0]][parts[1]] = value;
//       }
      
//       return newData;
//     });
//   };

//   const handleStatusChange = (newStatus) => {
//     setFormData(prev => ({
//       ...prev,
//       status: newStatus
//     }));
    
//     toast.success(`Status: ${newStatus}`, {
//       duration: 2000,
//       position: "bottom-right",
//       icon: newStatus === "ready" ? "✅" : "⏳"
//     });
//   };

//   const handleNoteChange = (newNote) => {
//     setFormData(prev => ({
//       ...prev,
//       note: newNote
//     }));
//   };

//   const mapToTurkeyInvoiceSchema = (formData, hotelConfig) => {
//     const accommodation = formData.accommodation_details || {};
//     const services = formData.other_services || [];
    
//     // Detect hotel type
//     const isGrandAras = hotelConfig?.hotel_name?.includes('GrandAras') || 
//                         hotelConfig?.hotel_name?.includes('Grand Aras');
    
//     // Calculate based on hotel type
//     let eurAmount, exchangeRate, totalNights, roomAmountTry, subTotal, taxableAmount, vat10, accTax;
    
//     if (isGrandAras) {
//       eurAmount = parseFloat(accommodation.eur_amount) || 0;
//       exchangeRate = parseFloat(accommodation.exchange_rate) || 0;
//       totalNights = parseInt(accommodation.total_nights) || 0;
//       roomAmountTry = parseFloat(accommodation.room_amount_try) || (eurAmount * exchangeRate);
//       subTotal = parseFloat(accommodation.total_room_all_nights) || (roomAmountTry * totalNights);
//       taxableAmount = parseFloat(accommodation.taxable_amount_room) || (subTotal / 1.12);
//       vat10 = parseFloat(accommodation.vat_10_percent) || (taxableAmount * 0.1);
//       accTax = parseFloat(accommodation.accommodation_tax) || (taxableAmount * 0.02);
//     } else {
//       eurAmount = parseFloat(accommodation.eur_amount) || 0;
//       exchangeRate = parseFloat(accommodation.exchange_rate) || 0;
//       totalNights = parseInt(accommodation.total_nights) || 0;
//       roomAmountTry = eurAmount * exchangeRate;
//       taxableAmount = parseFloat(accommodation.taxable_amount) || (roomAmountTry / 1.12);
//       subTotal = parseFloat(accommodation.total_per_night) || (taxableAmount * totalNights);
//       vat10 = parseFloat(accommodation.vat_total_nights) || (taxableAmount * 0.1 * totalNights);
//       accTax = parseFloat(accommodation.acc_tax_total_nights) || (taxableAmount * 0.02 * totalNights);
//     }
    
//     // Calculate services totals
//     const servicesTotal = services.reduce((sum, s) => sum + (parseFloat(s.gross_amount) || 0), 0);
//     const serviceTaxable = services.reduce((sum, s) => sum + (parseFloat(s.taxable_amount) || 0), 0);
//     const serviceVAT = services.reduce((sum, s) => sum + (parseFloat(s.vat_20_percent) || 0), 0);
    
//     const grandTotal = taxableAmount + vat10 + accTax + servicesTotal;
//     const totalVAT = vat10 + serviceVAT;
    
//     // Build accommodation details array
//     const accommodationDetailsArray = [];
//     const arrivalDate = new Date(formData.arrival_date);
    
//     for (let i = 0; i < totalNights; i++) {
//       const currentDate = new Date(arrivalDate);
//       currentDate.setDate(currentDate.getDate() + i);
      
//       accommodationDetailsArray.push({
//         day: i + 1,
//         date: currentDate.toISOString().split('T')[0],
//         description: 'Hébergement / Accommodation',
//         rate: isGrandAras ? roomAmountTry : taxableAmount
//       });
//     }
    
//     // Build services array
//     const otherServicesArray = services.map(service => ({
//       name: service.service_name || 'Service',
//       amount: parseFloat(service.gross_amount) || 0,
//       taxable_amount: parseFloat(service.taxable_amount) || 0,
//       vat_20_percent: parseFloat(service.vat_20_percent) || 0,
//       date: service.service_date || formData.invoice_date
//     }));
    
//     // Return backend schema with dual field formats for compatibility
//     return {
//       data: {
//         hotel: formData.hotel_name,
//         guestName: formData.guest_name,
//         roomNo: formData.room_number,
//         voucherNo: formData.cash_no,
//         passportNo: formData.passport_no,
//         confirmation: formData.passport_no,
//         vNo: formData.folio_number,
//         referenceNo: formData.company_name,
//         userId: formData.user_code,
//         batchNo: formData.page_number || '1',
//         invoiceDate: formData.invoice_date,
//         arrivalDate: formData.arrival_date,
//         departureDate: formData.departure_date,
//         paxAdult: parseInt(formData.adults) || 1,
//         paxChild: parseInt(formData.children) || 0,
//         nights: totalNights,
//         actualRate: eurAmount,
//         exchangeRate: exchangeRate,
//         sellingRate: roomAmountTry,
//         subTotal: subTotal,
        
//         // Store both field name formats for compatibility
//         taxable_amount: taxableAmount,
//         taxable_amount_room: taxableAmount,
//         vat1_10: isGrandAras ? vat10 : (taxableAmount * 0.1),
//         vat_10_percent: vat10,
//         vatTotal: totalVAT,
//         vat_total_nights: vat10,
//         accommodationTaxTotal: isGrandAras ? (accTax * totalNights) : accTax,
//         accommodation_tax: accTax,
//         acc_tax_total_nights: accTax,
//         total_per_night: subTotal,
//         total_room_all_nights: subTotal,
//         room_amount_try: roomAmountTry,
//         grandTotal: grandTotal,
        
//         accommodationDetails: accommodationDetailsArray,
//         otherServices: otherServicesArray,
        
//         status: formData.status,
//         note: formData.note || ''
//       }
//     };
//   };

//   const handleSave = async () => {
//     if (dateError) {
//       toast.error("Please fix date errors before saving", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     if (!formData.arrival_date || !formData.departure_date) {
//       toast.error("Please select arrival and departure dates", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     if (!formData.guest_name) {
//       toast.error("Guest name is required", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     setIsSaving(true);
//     const loadingToast = toast.loading(
//       isEditMode ? "Updating invoice..." : "Creating invoice...",
//       { position: "top-center" }
//     );
    
//     try {
//       const invoicePayload = mapToTurkeyInvoiceSchema(formData, hotelConfig);
      
//       let response;
//       if (isEditMode) {
//         response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
//       } else {
//         response = await turkeyInvoiceApi.createInvoice(invoicePayload);
//       }
      
//       toast.dismiss(loadingToast);
      
//       setSavedInvoiceData({
//         isEdit: isEditMode,
//         invoiceNumber: formData.company_name || (isEditMode ? invoiceId.substring(0, 8) : 'NEW'),
//         status: formData.status,
//         grandTotal: invoicePayload.data.grandTotal,
//         currency: hotelConfig.currency
//       });
      
//       setTimeout(() => {
//         const modalElement = document.getElementById('success_modal');
//         if (modalElement) {
//           modalElement.showModal();
//         } else {
//           toast.success("Invoice saved successfully!", { duration: 2000 });
//           setTimeout(() => navigate("/invoices"), 1500);
//         }
//       }, 100);
      
//     } catch (error) {
//       toast.dismiss(loadingToast);
      
//       let errorMessage = "Failed to save invoice";
//       if (error.response?.data?.detail) {
//         if (Array.isArray(error.response.data.detail)) {
//           errorMessage = error.response.data.detail.map(err => 
//             `${err.loc?.join('.')}: ${err.msg}`
//           ).join(', ');
//         } else {
//           errorMessage = error.response.data.detail;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       toast.error(errorMessage, { 
//         duration: 6000, 
//         position: "top-center" 
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleModalClose = () => {
//     navigate("/invoices");
//   };

//   const handleCancel = () => {
//     if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
//       navigate("/invoices");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
//         <div className="text-center">
//           <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
//           <p className="text-slate-600 text-lg">
//             {isEditMode ? "Loading invoice..." : "Loading hotel configuration..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] p-6">
//         <div className="max-w-3xl mx-auto">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
//             <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
//             <div>
//               <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
//               <p className="text-red-700">{error}</p>
//               <button
//                 onClick={() => navigate("/invoices")}
//                 className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
//               >
//                 Back to Invoices
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!hotelConfig) return null;

//   return (
//     <div className="min-h-screen bg-[#f8fafc] pb-32">
//       <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
//         <div className="mb-6 md:mb-8">
//           <button
//             onClick={() => navigate("/invoices")}
//             className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
//           >
//             <ArrowLeft size={20} />
//             <span className="text-sm font-medium">Back to Invoices</span>
//           </button>
          
//           <h1 className="text-xl md:text-2xl font-bold text-slate-800">
//             {isEditMode ? "Edit Invoice" : "Create New Invoice"}
//           </h1>
//           <p className="text-slate-500 text-sm mt-1">
//             {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
//           </p>
//         </div>

//         {dateError && (
//           <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//             <p className="text-red-800 font-medium text-sm">{dateError}</p>
//           </div>
//         )}

//         <div className="space-y-4 md:space-y-6">
//           <DynamicFormSection
//             title="Invoice Information"
//             fields={hotelConfig.form_fields || []}
//             formData={formData}
//             onFieldChange={handleFieldChange}
//             dateError={dateError}
//           />

//           {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
//             if (!section.enabled) return null;

//             return (
//               <DynamicConditionalSection
//                 key={sectionKey}
//                 sectionKey={sectionKey}
//                 section={section}
//                 formData={formData}
//                 onFieldChange={handleFieldChange}
//                 setFormData={setFormData}
//               />
//             );
//           })}

//           <DynamicSummarySection
//             config={hotelConfig}
//             formData={formData}
//             onStatusChange={handleStatusChange}
//             onNoteChange={handleNoteChange}
//           />
//         </div>

//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
//           <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
//             <button
//               onClick={handleCancel}
//               disabled={isSaving}
//               className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               Cancel
//             </button>

//             <button
//               onClick={handleSave}
//               disabled={isSaving || !!dateError}
//               className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isSaving ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   {isEditMode ? "Updating..." : "Saving..."}
//                 </>
//               ) : (
//                 <>
//                   <Save size={16} />
//                   {isEditMode ? "Update Invoice" : "Save Invoice"}
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {savedInvoiceData && (
//         <SuccessModal
//           isEdit={savedInvoiceData.isEdit}
//           invoiceNumber={savedInvoiceData.invoiceNumber}
//           status={savedInvoiceData.status}
//           grandTotal={savedInvoiceData.grandTotal}
//           currency={savedInvoiceData.currency}
//           onClose={handleModalClose}
//         />
//       )}
//     </div>
//   );
// }







// DynamicInvoiceFormPage.jsx final
// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
// import toast from "react-hot-toast";
// import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
// import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// import {
//   DynamicConditionalSection,
//   DynamicFormSection,
//   DynamicSummarySection,
//   SuccessModal
// } from '../components';
// import { detectHotelType, mapToBackendSchema, calculateFinalSummary } from "../utils/invoiceCalculations";

// export default function DynamicInvoiceFormPage() {
//   const navigate = useNavigate();
//   const params = useParams();
  
//   const isEditMode = Boolean(params.invoiceId && !params.hotelId);
//   const invoiceId = params.invoiceId;
//   const hotelIdFromRoute = params.hotelId;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hotelConfig, setHotelConfig] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [dateError, setDateError] = useState("");
//   const [formData, setFormData] = useState({});
//   const [savedInvoiceData, setSavedInvoiceData] = useState(null);

//   // Load invoice or hotel config on mount
//   useEffect(() => {
//     if (isEditMode && invoiceId) {
//       loadInvoiceAndConfig();
//     } else if (hotelIdFromRoute) {
//       loadHotelConfig(hotelIdFromRoute);
//     }
//   }, [isEditMode, invoiceId, hotelIdFromRoute]);

//   // Auto-calculate nights from dates
//   useEffect(() => {
//     if (!formData.arrival_date || !formData.departure_date) return;

//     const arrival = new Date(formData.arrival_date);
//     const departure = new Date(formData.departure_date);
    
//     if (departure <= arrival) {
//       setDateError("Departure date must be after arrival date");
//       if (formData.accommodation_details?.total_nights) {
//         setFormData(prev => ({
//           ...prev,
//           accommodation_details: {
//             ...prev.accommodation_details,
//             total_nights: 0
//           }
//         }));
//       }
//       return;
//     }
    
//     setDateError("");
//     const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

//     if (formData.accommodation_details) {
//       setFormData(prev => ({
//         ...prev,
//         accommodation_details: {
//           ...prev.accommodation_details,
//           total_nights: diffDays
//         }
//       }));
//     }
//   }, [formData.arrival_date, formData.departure_date]);

//   const loadInvoiceAndConfig = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
//       let invoiceData = invoiceResponse.data || invoiceResponse;
      
//       // Handle nested data structure
//       if (invoiceData.data?.data) {
//         invoiceData.data = invoiceData.data.data;
//       }

//       const data = invoiceData.data || invoiceData;
//       const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";
      
//       // Get all hotel configs
//       const allConfigsResponse = await getHotelConfigs();
//       const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      
//       let hotelConfig = allConfigs.find(config => config.hotel_name === hotelName);
      
//       if (!hotelConfig && allConfigs.length > 0) {
//         hotelConfig = allConfigs[0];
//       }
      
//       if (!hotelConfig) {
//         throw new Error(`No hotel configuration found`);
//       }
      
//       setHotelConfig(hotelConfig);
      
//       // Map invoice data to form
//       const mappedData = mapInvoiceToForm(invoiceData, hotelConfig);
//       setFormData(mappedData);
      
//       toast.success("Invoice loaded successfully", {
//         duration: 2000,
//         icon: "📄"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load invoice");
//       toast.error(err.message || "Failed to load invoice", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadHotelConfig = async (hotelId) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await getHotelConfigById(hotelId);
//       setHotelConfig(response);
//       initializeFormData(response);
      
//       toast.success("Hotel configuration loaded", {
//         duration: 2000,
//         icon: "🏨"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load hotel configuration");
//       toast.error(err.message || "Failed to load hotel configuration", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const mapInvoiceToForm = (invoiceData, hotelConfig) => {
//     // Extract data from nested structure
//     let data = invoiceData;
//     if (data?.data) data = data.data;
//     if (data?.data) data = data.data;
    
//     const hotelType = detectHotelType(hotelConfig);
//     const isGrandAras = hotelType === 'GRAND_ARAS';
    
//     const accommodationConfig = hotelConfig?.conditional_sections?.accommodation_details;
//     const servicesConfig = hotelConfig?.conditional_sections?.other_services;
    
//     // Build accommodation details dynamically based on config
//     const accommodationDetails = {};
    
//     if (accommodationConfig?.fields) {
//       accommodationConfig.fields.forEach(field => {
//         const fieldId = field.field_id;
//         let value = null;
        
//         // Try direct match first
//         if (data[fieldId] !== undefined) {
//           value = data[fieldId];
//         }
//         // Common field aliases
//         else if (fieldId === 'eur_amount' && data.actualRate !== undefined) {
//           value = data.actualRate;
//         }
//         else if (fieldId === 'exchange_rate' && data.exchangeRate !== undefined) {
//           value = data.exchangeRate;
//         }
//         else if (fieldId === 'total_nights' && data.nights !== undefined) {
//           value = data.nights;
//         }
//         // Grand Aras specific fields
//         else if (fieldId === 'room_amount_try') {
//           value = data.room_amount_try || data.sellingRate;
//         }
//         else if (fieldId === 'total_room_all_nights') {
//           value = data.total_room_all_nights || data.subTotal;
//         }
//         else if (fieldId === 'taxable_amount_room') {
//           value = data.taxable_amount_room || data.taxable_amount;
//         }
//         else if (fieldId === 'vat_10_percent') {
//           value = data.vat_10_percent || data.vat1_10;
//         }
//         else if (fieldId === 'accommodation_tax') {
//           value = data.accommodation_tax || data.accommodationTaxTotal;
//         }
//         // CVK specific fields
//         else if (fieldId === 'taxable_amount') {
//           value = data.taxable_amount || data.sellingRate;
//         }
//         else if (fieldId === 'total_per_night') {
//           value = data.total_per_night || data.subTotal;
//         }
//         else if (fieldId === 'vat_total_nights') {
//           value = data.vat_total_nights || data.vat7;
//         }
//         else if (fieldId === 'acc_tax_total_nights') {
//           value = data.acc_tax_total_nights || data.accommodationTaxTotal;
//         }
        
//         accommodationDetails[fieldId] = value !== null ? value : '';
//       });
//     }
    
//     // Build services array dynamically based on config
//     const otherServices = [];
    
//     if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
//       data.otherServices.forEach(service => {
//         const mappedService = { id: Date.now() + Math.random() };
        
//         servicesConfig.fields.forEach(field => {
//           const fieldId = field.field_id;
          
//           if (fieldId === 'service_name' && service.name !== undefined) {
//             mappedService[fieldId] = service.name;
//           }
//           else if (fieldId === 'service_date' && service.date !== undefined) {
//             mappedService[fieldId] = service.date;
//           }
//           else if (fieldId === 'gross_amount' && service.amount !== undefined) {
//             mappedService[fieldId] = service.amount;
//           }
//           else if (fieldId === 'taxable_amount' && service.taxable_amount !== undefined) {
//             mappedService[fieldId] = service.taxable_amount;
//           }
//           else if (fieldId === 'vat_20_percent' && service.vat_20_percent !== undefined) {
//             mappedService[fieldId] = service.vat_20_percent;
//           }
//           else if (service[fieldId] !== undefined) {
//             mappedService[fieldId] = service[fieldId];
//           }
//           else {
//             mappedService[fieldId] = '';
//           }
//         });
        
//         otherServices.push(mappedService);
//       });
//     }
    
//     return {
//       hotel_name: data.hotel || hotelConfig?.hotel_name || '',
//       currency: hotelConfig?.currency || 'TRY',
//       company_name: data.referenceNo || data.company_name || '',
//       guest_name: data.guestName || '',
//       arrival_date: data.arrivalDate || '',
//       departure_date: data.departureDate || '',
//       folio_number: data.vNo || data.folio_number || '',
//       invoice_date: data.invoiceDate || '',
//       room_number: data.roomNo || '',
//       adults: String(data.paxAdult || 1),
//       children: String(data.paxChild || 0),
//       passport_no: data.passportNo || '',
//       user_code: data.userId || '',
//       cash_no: data.voucherNo || '',
//       page_number: data.batchNo || '',
//       accommodation_details: accommodationDetails,
//       other_services: otherServices,
//       status: data.status || 'pending',
//       note: data.note || ''
//     };
//   };

//   const initializeFormData = (config) => {
//     const initialData = {
//       hotel_name: config.hotel_name,
//       currency: config.currency,
//       status: "pending",
//       note: ""
//     };

//     // Initialize form fields
//     config.form_fields?.forEach(field => {
//       initialData[field.field_id] = "";
//     });

//     // Initialize conditional sections
//     Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
//       if (section.enabled) {
//         initialData[sectionKey] = {};
        
//         section.fields?.forEach(field => {
//           initialData[sectionKey][field.field_id] = field.fixed_value || "";
//         });

//         if (section.multiple_entries) {
//           initialData[sectionKey] = [];
//         }
//       }
//     });

//     setFormData(initialData);
//   };

//   const handleFieldChange = (fieldPath, value) => {
//     setFormData(prev => {
//       const newData = { ...prev };
//       const parts = fieldPath.split('.');
      
//       if (parts.length === 1) {
//         newData[parts[0]] = value;
//       } else if (parts.length === 2) {
//         if (!newData[parts[0]]) {
//           newData[parts[0]] = {};
//         }
//         newData[parts[0]][parts[1]] = value;
//       }
      
//       return newData;
//     });
//   };

//   const handleStatusChange = (newStatus) => {
//     setFormData(prev => ({
//       ...prev,
//       status: newStatus
//     }));
    
//     toast.success(`Status: ${newStatus}`, {
//       duration: 2000,
//       position: "bottom-right",
//       icon: newStatus === "ready" ? "✅" : "⏳"
//     });
//   };

//   const handleNoteChange = (newNote) => {
//     setFormData(prev => ({
//       ...prev,
//       note: newNote
//     }));
//   };

//   const handleSave = async () => {
//     if (dateError) {
//       toast.error("Please fix date errors before saving", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     if (!formData.arrival_date || !formData.departure_date) {
//       toast.error("Please select arrival and departure dates", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     if (!formData.guest_name) {
//       toast.error("Guest name is required", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     setIsSaving(true);
//     const loadingToast = toast.loading(
//       isEditMode ? "Updating invoice..." : "Creating invoice...",
//       { position: "top-center" }
//     );
    
//     try {
//       console.log("💾 Saving invoice with formData:", formData);
      
//       // Use centralized mapping function
//       const hotelType = detectHotelType(hotelConfig);
//       const invoicePayload = mapToBackendSchema(formData, hotelConfig);
      
//       console.log("📤 Backend payload:", invoicePayload);
      
//       // Calculate summary for modal display
//       const summary = calculateFinalSummary(formData, hotelType);
      
//       let response;
//       if (isEditMode) {
//         response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
//       } else {
//         response = await turkeyInvoiceApi.createInvoice(invoicePayload);
//       }
      
//       toast.dismiss(loadingToast);
      
//       setSavedInvoiceData({
//         isEdit: isEditMode,
//         invoiceNumber: formData.company_name || (isEditMode ? invoiceId.substring(0, 8) : 'NEW'),
//         status: formData.status,
//         grandTotal: summary.grand_total,
//         currency: hotelConfig.currency
//       });
      
//       setTimeout(() => {
//         const modalElement = document.getElementById('success_modal');
//         if (modalElement) {
//           modalElement.showModal();
//         } else {
//           toast.success("Invoice saved successfully!", { duration: 2000 });
//           setTimeout(() => navigate("/invoices"), 1500);
//         }
//       }, 100);
      
//     } catch (error) {
//       toast.dismiss(loadingToast);
      
//       let errorMessage = "Failed to save invoice";
//       if (error.response?.data?.detail) {
//         if (Array.isArray(error.response.data.detail)) {
//           errorMessage = error.response.data.detail.map(err => 
//             `${err.loc?.join('.')}: ${err.msg}`
//           ).join(', ');
//         } else {
//           errorMessage = error.response.data.detail;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       toast.error(errorMessage, { 
//         duration: 6000, 
//         position: "top-center" 
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleModalClose = () => {
//     navigate("/invoices");
//   };

//   const handleCancel = () => {
//     if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
//       navigate("/invoices");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
//         <div className="text-center">
//           <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
//           <p className="text-slate-600 text-lg">
//             {isEditMode ? "Loading invoice..." : "Loading hotel configuration..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] p-6">
//         <div className="max-w-3xl mx-auto">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
//             <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
//             <div>
//               <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
//               <p className="text-red-700">{error}</p>
//               <button
//                 onClick={() => navigate("/invoices")}
//                 className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
//               >
//                 Back to Invoices
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!hotelConfig) return null;

//   const hotelType = detectHotelType(hotelConfig);

//   return (
//     <div className="min-h-screen bg-[#f8fafc] pb-32">
//       <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
//         <div className="mb-6 md:mb-8">
//           <button
//             onClick={() => navigate("/invoices")}
//             className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
//           >
//             <ArrowLeft size={20} />
//             <span className="text-sm font-medium">Back to Invoices</span>
//           </button>
          
//           <h1 className="text-xl md:text-2xl font-bold text-slate-800">
//             {isEditMode ? "Edit Invoice" : "Create New Invoice"}
//           </h1>
//           <p className="text-slate-500 text-sm mt-1">
//             {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
//             {hotelType === 'GRAND_ARAS' && (
//               <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
//                 Grand Aras Mode
//               </span>
//             )}
//           </p>
//         </div>

//         {dateError && (
//           <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//             <p className="text-red-800 font-medium text-sm">{dateError}</p>
//           </div>
//         )}

//         <div className="space-y-4 md:space-y-6">
//           <DynamicFormSection
//             title="Invoice Information"
//             fields={hotelConfig.form_fields || []}
//             formData={formData}
//             onFieldChange={handleFieldChange}
//             dateError={dateError}
//           />

//           {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
//             if (!section.enabled) return null;

//             return (
//               <DynamicConditionalSection
//                 key={sectionKey}
//                 sectionKey={sectionKey}
//                 section={section}
//                 formData={formData}
//                 onFieldChange={handleFieldChange}
//                 setFormData={setFormData}
//                 hotelConfig={hotelConfig}
//               />
//             );
//           })}

//           <DynamicSummarySection
//             config={hotelConfig}
//             formData={formData}
//             onStatusChange={handleStatusChange}
//             onNoteChange={handleNoteChange}
//           />
//         </div>

//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
//           <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
//             <button
//               onClick={handleCancel}
//               disabled={isSaving}
//               className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               Cancel
//             </button>

//             <button
//               onClick={handleSave}
//               disabled={isSaving || !!dateError}
//               className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isSaving ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   {isEditMode ? "Updating..." : "Saving..."}
//                 </>
//               ) : (
//                 <>
//                   <Save size={16} />
//                   {isEditMode ? "Update Invoice" : "Save Invoice"}
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {savedInvoiceData && (
//         <SuccessModal
//           isEdit={savedInvoiceData.isEdit}
//           invoiceNumber={savedInvoiceData.invoiceNumber}
//           status={savedInvoiceData.status}
//           grandTotal={savedInvoiceData.grandTotal}
//           currency={savedInvoiceData.currency}
//           onClose={handleModalClose}
//         />
//       )}
//     </div>
//   );
// }






































// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
// import toast from "react-hot-toast";
// import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
// import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// import {
//   DynamicConditionalSection,
//   DynamicFormSection,
//   DynamicSummarySection,
//   SuccessModal
// } from '../components';

// export default function DynamicInvoiceFormPage() {
//   const navigate = useNavigate();
//   const params = useParams();
  
//   const isEditMode = Boolean(params.invoiceId && !params.hotelId);
//   const invoiceId = params.invoiceId;
//   const hotelIdFromRoute = params.hotelId;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hotelConfig, setHotelConfig] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [dateError, setDateError] = useState("");
//   const [formData, setFormData] = useState({});
//   const [savedInvoiceData, setSavedInvoiceData] = useState(null);

//   // ✅ Determine if this is Grand Aras hotel
//   const isGrandAras = hotelConfig?.hotel_name?.toLowerCase().includes('grand aras');

//   useEffect(() => {
//     if (isEditMode && invoiceId) {
//       loadInvoiceAndConfig();
//     } else if (hotelIdFromRoute) {
//       loadHotelConfig(hotelIdFromRoute);
//     }
//   }, [isEditMode, invoiceId, hotelIdFromRoute]);

//   // ✅ ENHANCED: Auto-calculate nights for both CVK and Grand Aras
//   useEffect(() => {
//     if (formData.arrival_date && formData.departure_date) {
//       const arrival = new Date(formData.arrival_date);
//       const departure = new Date(formData.departure_date);
      
//       if (departure <= arrival) {
//         setDateError("Departure date must be after arrival date");
        
//         // Clear nights in accommodation_details
//         if (formData.accommodation_details) {
//           setFormData(prev => ({
//             ...prev,
//             accommodation_details: {
//               ...prev.accommodation_details,
//               total_nights: 0
//             }
//           }));
//         }
//         return;
//       } else {
//         setDateError("");
//       }

//       const diffTime = Math.abs(departure - arrival);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//       // Update total_nights in accommodation_details
//       if (formData.accommodation_details) {
//         setFormData(prev => ({
//           ...prev,
//           accommodation_details: {
//             ...prev.accommodation_details,
//             total_nights: diffDays
//           }
//         }));
//       }
//     }
//   }, [formData.arrival_date, formData.departure_date]);

//   // ✅ ENHANCED: Accommodation calculations for both CVK and Grand Aras
//   useEffect(() => {
//     const acc = formData.accommodation_details;
//     if (!acc) return;

//     const eurAmount = parseFloat(acc.eur_amount) || 0;
//     const exchangeRate = parseFloat(acc.exchange_rate) || 0;
//     const totalNights = parseInt(acc.total_nights) || 0;

//     if (eurAmount > 0 && exchangeRate > 0) {
//       if (isGrandAras) {
//         // 🎯 GRAND ARAS CALCULATIONS
//         // a = EUR Amount × Exchange Rate
//         const roomAmountTry = eurAmount * exchangeRate;
        
//         // b = Total Nights × a
//         const totalRoomAllNights = roomAmountTry * totalNights;
        
//         // d = b ÷ 1.12
//         const taxableAmountRoom = totalRoomAllNights / 1.12;
        
//         // g = d × 0.10
//         const vat10Percent = taxableAmountRoom * 0.1;
        
//         // j = d × 0.02
//         const accommodationTax = taxableAmountRoom * 0.02;

//         setFormData(prev => ({
//           ...prev,
//           accommodation_details: {
//             ...prev.accommodation_details,
//             room_amount_try: roomAmountTry.toFixed(2),
//             total_room_all_nights: totalRoomAllNights.toFixed(2),
//             taxable_amount_room: taxableAmountRoom.toFixed(2),
//             vat_10_percent: vat10Percent.toFixed(2),
//             accommodation_tax: accommodationTax.toFixed(2),
//           }
//         }));
//       } else {
//         // 🏨 CVK CALCULATIONS (original logic)
//         const taxableAmount = (eurAmount * exchangeRate) / 1.12;
//         const vat10Percent = taxableAmount * 0.1;
//         const accommodationTax = taxableAmount * 0.02;

//         setFormData(prev => ({
//           ...prev,
//           accommodation_details: {
//             ...prev.accommodation_details,
//             taxable_amount: taxableAmount.toFixed(2),
//             vat_10_percent: vat10Percent.toFixed(2),
//             accommodation_tax: accommodationTax.toFixed(2),
//             total_per_night: totalNights > 0 ? (totalNights * taxableAmount).toFixed(2) : "0.00",
//             vat_total_nights: totalNights > 0 ? (totalNights * vat10Percent).toFixed(2) : "0.00",
//             acc_tax_total_nights: totalNights > 0 ? (totalNights * accommodationTax).toFixed(2) : "0.00"
//           }
//         }));
//       }
//     }
//   }, [
//     formData.accommodation_details?.eur_amount,
//     formData.accommodation_details?.exchange_rate,
//     formData.accommodation_details?.total_nights,
//     isGrandAras
//   ]);

//   // ✅ ENHANCED: Service calculations (20% VAT for Grand Aras, works for CVK too)
//   useEffect(() => {
//     if (!formData.other_services || !Array.isArray(formData.other_services)) return;

//     const updatedServices = formData.other_services.map(service => {
//       const grossAmount = parseFloat(service.gross_amount) || 0;
      
//       if (grossAmount > 0) {
//         // e = c ÷ 1.2
//         const taxableAmount = grossAmount / 1.2;
        
//         // h = e × 0.20
//         const vat20Percent = taxableAmount * 0.2;

//         return {
//           ...service,
//           taxable_amount: taxableAmount.toFixed(2),
//           vat_20_percent: vat20Percent.toFixed(2)
//         };
//       }
      
//       return service;
//     });

//     const hasChanges = updatedServices.some((service, idx) => {
//       const original = formData.other_services[idx];
//       return service.taxable_amount !== original.taxable_amount ||
//              service.vat_20_percent !== original.vat_20_percent;
//     });

//     if (hasChanges) {
//       setFormData(prev => ({
//         ...prev,
//         other_services: updatedServices
//       }));
//     }
//   }, [formData.other_services?.map(s => s.gross_amount).join(',')]);

//   const loadInvoiceAndConfig = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
//       let invoiceData = invoiceResponse.data || invoiceResponse;
      
//       if (invoiceData.data && invoiceData.data.data) {
//         invoiceData.data = invoiceData.data.data;
//       }

//       const data = invoiceData.data || invoiceData;
//       const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";
      
//       const allConfigsResponse = await getHotelConfigs();
//       const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      
//       let hotelConfig = allConfigs.find(config => config.hotel_name === hotelName);
      
//       if (!hotelConfig && allConfigs.length > 0) {
//         hotelConfig = allConfigs[0];
//       }
      
//       if (!hotelConfig) {
//         throw new Error(`No hotel configuration found`);
//       }
      
//       setHotelConfig(hotelConfig);
//       mapInvoiceToForm(invoiceData, hotelConfig);
      
//       toast.success("Invoice loaded successfully", {
//         duration: 2000,
//         icon: "📄"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load invoice");
//       toast.error(err.message || "Failed to load invoice", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadHotelConfig = async (hotelId) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await getHotelConfigById(hotelId);
//       setHotelConfig(response);
//       initializeFormData(response);
      
//       toast.success("Hotel configuration loaded", {
//         duration: 2000,
//         icon: "🏨"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load hotel configuration");
//       toast.error(err.message || "Failed to load hotel configuration", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ ENHANCED: Map invoice data to form for both CVK and Grand Aras
//   const mapInvoiceToForm = (invoiceData, config) => {
//     let data = invoiceData.data || invoiceData;
    
//     if (data.data && typeof data.data === 'object') {
//       data = data.data;
//     }
    
//     const isGrandArasConfig = config.hotel_name?.toLowerCase().includes('grand aras');
    
//     const taxableAmount = parseFloat(data.sellingRate) || 0;
//     const totalNights = parseInt(data.nights) || 0;
//     const accommodationTaxPerNight = taxableAmount * 0.02;
//     const totalAccommodationTax = accommodationTaxPerNight * totalNights;
    
//     const mappedFormData = {
//       hotel_name: data.hotel || config.hotel_name,
//       currency: config.currency,
//       company_name: data.referenceNo || "",
//       guest_name: data.guestName || "",
//       arrival_date: data.arrivalDate || "",
//       departure_date: data.departureDate || "",
//       room_number: data.roomNo || data.vd || "",
//       folio_number: data.vNo || "",
//       adults: data.paxAdult?.toString() || "1",
//       children: data.paxChild?.toString() || "0",
//       passport_no: data.passportNo || "",
//       user_code: data.userId || "",
//       cash_no: data.voucherNo || "",
//       page_number: data.batchNo || "",
//       invoice_date: data.invoiceDate || "",
//       status: data.status || "pending",
//       note: data.note || "",
//     };

//     // ✅ Handle accommodation_details differently for Grand Aras vs CVK
//     if (isGrandArasConfig) {
//       // 🎯 GRAND ARAS structure
//       const eurAmount = parseFloat(data.actualRate) || 0;
//       const exchangeRate = parseFloat(data.exchangeRate) || 0;
//       const roomAmountTry = eurAmount * exchangeRate;
//       const totalRoomAllNights = roomAmountTry * totalNights;
//       const taxableAmountRoom = totalRoomAllNights / 1.12;
//       const vat10Percent = taxableAmountRoom * 0.1;
//       const accTax = taxableAmountRoom * 0.02;

//       mappedFormData.accommodation_details = {
//         eur_amount: eurAmount.toString(),
//         exchange_rate: exchangeRate.toString(),
//         total_nights: totalNights,
//         room_amount_try: roomAmountTry.toFixed(2),
//         total_room_all_nights: totalRoomAllNights.toFixed(2),
//         taxable_amount_room: taxableAmountRoom.toFixed(2),
//         vat_10_percent: vat10Percent.toFixed(2),
//         accommodation_tax: accTax.toFixed(2),
//       };
//     } else {
//       // 🏨 CVK structure (original)
//       mappedFormData.accommodation_details = {
//         eur_amount: data.actualRate?.toString() || "0",
//         exchange_rate: data.exchangeRate?.toString() || "0",
//         total_nights: totalNights,
//         taxable_amount: taxableAmount.toFixed(2),
//         vat_10_percent: (parseFloat(data.vat1_10) || 0).toFixed(2),
//         accommodation_tax: accommodationTaxPerNight.toFixed(2),
//         total_per_night: (parseFloat(data.subTotal) || 0).toFixed(2),
//         vat_total_nights: (parseFloat(data.vat7) || 0).toFixed(2),
//         acc_tax_total_nights: totalAccommodationTax.toFixed(2)
//       };
//     }

//     // ✅ Map other services (same for both)
//     mappedFormData.other_services = (data.otherServices || []).map(service => ({
//       id: Date.now() + Math.random(),
//       service_name: service.name || "",
//       service_date: service.date || "",
//       gross_amount: service.amount?.toString() || "0",
//       taxable_amount: service.amount ? (service.amount / 1.2).toFixed(2) : "0",
//       vat_20_percent: service.amount ? ((service.amount / 1.2) * 0.2).toFixed(2) : "0",
//     }));
    
//     setFormData(mappedFormData);
//   };

//   const initializeFormData = (config) => {
//     const initialData = {
//       hotel_name: config.hotel_name,
//       currency: config.currency,
//       status: "pending",
//       note: ""
//     };

//     config.form_fields?.forEach(field => {
//       initialData[field.field_id] = field.default || "";
//     });

//     Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
//       if (section.enabled) {
//         if (section.multiple_entries) {
//           initialData[sectionKey] = [];
//         } else {
//           initialData[sectionKey] = {};
          
//           section.fields?.forEach(field => {
//             initialData[sectionKey][field.field_id] = field.fixed_value || field.default || "";
//           });
//         }
//       }
//     });

//     setFormData(initialData);
//   };

//   const handleFieldChange = (fieldPath, value) => {
//     setFormData(prev => {
//       const newData = { ...prev };
//       const parts = fieldPath.split('.');
      
//       if (parts.length === 1) {
//         newData[parts[0]] = value;
//       } else if (parts.length === 2) {
//         if (!newData[parts[0]]) {
//           newData[parts[0]] = {};
//         }
//         newData[parts[0]][parts[1]] = value;
//       }
      
//       return newData;
//     });
//   };

//   const handleStatusChange = (newStatus) => {
//     setFormData(prev => ({
//       ...prev,
//       status: newStatus
//     }));
    
//     toast.success(`Status: ${newStatus}`, {
//       duration: 2000,
//       position: "bottom-right",
//       icon: newStatus === "ready" ? "✅" : "⏳"
//     });
//   };

//   const handleNoteChange = (newNote) => {
//     setFormData(prev => ({
//       ...prev,
//       note: newNote
//     }));
//   };

//   // ✅ ENHANCED: Calculate final summary for both CVK and Grand Aras
//   const calculateFinalSummary = (data) => {
//     const acc = data.accommodation_details || {};
//     const services = data.other_services || [];
    
//     if (isGrandAras) {
//       // 🎯 GRAND ARAS calculations
//       const totalRoomAllNights = parseFloat(acc.total_room_all_nights) || 0;
//       const taxableAmountRoom = parseFloat(acc.taxable_amount_room) || 0;
//       const vat10Percent = parseFloat(acc.vat_10_percent) || 0;
//       const accTax = parseFloat(acc.accommodation_tax) || 0;
      
//       // c = Total of all service gross amounts
//       const totalLaundryAmount = services.reduce((sum, s) => 
//         sum + (parseFloat(s.gross_amount) || 0), 0
//       );
      
//       // e = Total taxable for services
//       const totalTaxableServices = services.reduce((sum, s) => 
//         sum + (parseFloat(s.taxable_amount) || 0), 0
//       );
      
//       // h = Total VAT 20%
//       const totalVat20 = services.reduce((sum, s) => 
//         sum + (parseFloat(s.vat_20_percent) || 0), 0
//       );
      
//       // f = d + c
//       const totalTaxableAmount = taxableAmountRoom + totalLaundryAmount;
      
//       // i = g + h
//       const totalVat = vat10Percent + totalVat20;
      
//       // k = f + i + j
//       const grandTotal = totalTaxableAmount + totalVat + accTax;
      
//       // m = k ÷ exchange_rate
//       const totalInEur = grandTotal / (parseFloat(acc.exchange_rate) || 1);
      
//       return {
//         total_laundry_amount: totalLaundryAmount,
//         total_taxable_amount_room: taxableAmountRoom,
//         total_taxable_amount_services: totalTaxableServices,
//         total_taxable_amount: totalTaxableAmount,
//         total_vat_10: vat10Percent,
//         total_vat_20: totalVat20,
//         total_vat: totalVat,
//         total_accommodation_tax: accTax,
//         grand_total: grandTotal,
//         total_in_eur: totalInEur,
//         // For backend compatibility
//         total_amount: totalRoomAllNights,
//         total_including_vat_kdv_dahil: grandTotal
//       };
//     } else {
//       // 🏨 CVK calculations (original)
//       const accTotal = parseFloat(acc.total_per_night) || 0;
//       const accVat = parseFloat(acc.vat_total_nights) || 0;
//       const accTax = parseFloat(acc.acc_tax_total_nights) || 0;
      
//       const servicesTotal = services.reduce((sum, s) => 
//         sum + (parseFloat(s.taxable_amount) || 0), 0
//       );
//       const servicesVat = services.reduce((sum, s) => 
//         sum + (parseFloat(s.vat_20_percent) || 0), 0
//       );
      
//       const totalAmount = accTotal + servicesTotal;
//       const totalVat = accVat + servicesVat;
//       const totalIncludingVat = totalAmount + totalVat + accTax;
//       const totalInEur = totalIncludingVat / (parseFloat(acc.exchange_rate) || 1);
      
//       return {
//         total_amount: totalAmount,
//         total_vat_10: totalVat,
//         total_acc_tax: accTax,
//         total_including_vat_kdv_dahil: totalIncludingVat,
//         total_in_eur: totalInEur
//       };
//     }
//   };

//   // ✅ CORRECTED: Map to Turkey Invoice schema for both CVK and Grand Aras
//   const mapToTurkeyInvoiceSchema = (dynamicData, calculatedSummary) => {
//     const toFixed2 = (value) => {
//       const num = parseFloat(value || 0);
//       return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
//     };

//     const capitalizeWords = (str) => {
//       if (!str) return "";
//       return str
//         .trim()
//         .replace(/\s+/g, " ")
//         .split(" ")
//         .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
//         .join(" ");
//     };

//     const acc = dynamicData.accommodation_details || {};
//     const totalNights = parseInt(acc.total_nights) || 0;
    
//     const formatDate = (dateStr) => {
//       if (!dateStr) return new Date().toISOString().split("T")[0];
//       return dateStr.split("T")[0];
//     };

//     const status = dynamicData.status || "pending";

//     // ✅ Get correct values based on hotel type
//     let sellingRate, subTotal, vatTotal, vat1_10, accommodationTaxTotal;
    
//     if (isGrandAras) {
//       // For Grand Aras, use the values from formData.accommodation_details
//       sellingRate = toFixed2(acc.taxable_amount_room); // This is the taxable amount (d)
//       subTotal = toFixed2(acc.total_room_all_nights); // This is b (Total Room All Nights)
//       vat1_10 = toFixed2(acc.vat_10_percent); // This is g (VAT 10%)
//       vatTotal = toFixed2(calculatedSummary.total_vat); // Total VAT (i = g + h)
//       accommodationTaxTotal = toFixed2(acc.accommodation_tax); // This is j (Accommodation Tax)
      
//       console.log("🎯 Grand Aras Mappings:", {
//         frontend: {
//           taxable_amount_room: acc.taxable_amount_room,
//           total_room_all_nights: acc.total_room_all_nights,
//           vat_10_percent: acc.vat_10_percent,
//           accommodation_tax: acc.accommodation_tax
//         },
//         backend: {
//           sellingRate,
//           subTotal,
//           vat1_10,
//           vatTotal,
//           accommodationTaxTotal
//         }
//       });
//     } else {
//       // For CVK
//       sellingRate = toFixed2(acc.taxable_amount);
//       subTotal = toFixed2(calculatedSummary.total_amount || acc.total_per_night);
//       vat1_10 = toFixed2(acc.vat_10_percent);
//       vatTotal = toFixed2(calculatedSummary.total_vat_10 || acc.vat_total_nights);
//       accommodationTaxTotal = toFixed2(calculatedSummary.total_acc_tax || acc.acc_tax_total_nights);
//     }

//     const invoicePayload = {
//       data: {
//         referenceNo: dynamicData.company_name || `INV-${Date.now()}`,
//         invoiceDate: formatDate(dynamicData.invoice_date),
//         guestName: capitalizeWords(dynamicData.guest_name) || "Guest",
//         hotel: dynamicData.hotel_name || "Hotel",
//         vd: dynamicData.room_number || "",
//         vNo: dynamicData.folio_number || "",
//         roomNo: dynamicData.room_number || "",
//         paxAdult: parseInt(dynamicData.adults) || 1,
//         paxChild: parseInt(dynamicData.children) || 0,
//         ratePlan: "",
//         arrivalDate: formatDate(dynamicData.arrival_date),
//         departureDate: formatDate(dynamicData.departure_date),
//         nights: totalNights,
//         confirmation: dynamicData.passport_no || "",
//         passportNo: dynamicData.passport_no || "",
//         voucherNo: dynamicData.cash_no || "",
//         userId: dynamicData.user_code || "",
//         batchNo: dynamicData.page_number || "",
//         actualRate: toFixed2(acc.eur_amount),
//         exchangeRate: toFixed2(acc.exchange_rate) || 1.0,
//         sellingRate: sellingRate, // This should be taxable amount (d for Grand Aras)
//         newRoomRate: sellingRate,
//         vat1_10: vat1_10, // VAT 10% from accommodation (g for Grand Aras)
//         vat7: vatTotal, // Total VAT (i for Grand Aras)
//         vat20: toFixed2(calculatedSummary.total_vat_20) || 0.0, // VAT 20% from services (h)
//         vat5: 0.0,
//         newVat1_10: 0.0,
//         newVat7: 0.0,
//         newVat20: 0.0,
//         newVat5: 0.0,
//         cityTaxRows: 0,
//         cityTaxAmount: 0.0,
//         stampTaxRows: 0,
//         stampTaxAmount: 0.0,
//         subTotal: subTotal, // This should be total_room_all_nights (b for Grand Aras)
//         vatTotal: vatTotal, // Total VAT (i)
//         stampTaxTotal: 0.0,
//         cityTaxTotal: 0.0,
//         accommodationTaxTotal: accommodationTaxTotal, // Accommodation tax (j for Grand Aras)
//         grandTotal: toFixed2(calculatedSummary.total_including_vat_kdv_dahil || calculatedSummary.grand_total || 0),
//         status: status,
//         note: dynamicData.note || "",
//         accommodationDetails: totalNights > 0 ? Array.from({ length: totalNights }, (_, i) => ({
//           day: i + 1,
//           date: formatDate(new Date(new Date(dynamicData.arrival_date).getTime() + i * 86400000).toISOString()),
//           description: "Hébergement / Accommodation",
//           rate: sellingRate, // Should use sellingRate (taxable amount per night)
//         })) : [],
//         cityTaxDetails: [],
//         stampTaxDetails: [],
//         otherServices: (dynamicData.other_services || []).map(service => ({
//           name: capitalizeWords(service.service_name) || "Service",
//           date: formatDate(service.service_date),
//           amount: toFixed2(service.gross_amount),
//           textField1: "",
//           textField2: "",
//         })),
//       }
//     };

//     console.log("📤 Final Invoice Payload:", invoicePayload);
//     return invoicePayload;
//   };

//   const handleSave = async () => {
//     console.log("📝 Form data to save:", formData);
    
//     if (dateError) {
//       toast.error("Please fix date errors before saving", { duration: 3000, position: "top-center" });
//       return;
//     }

//     if (!formData.arrival_date || !formData.departure_date) {
//       toast.error("Please select arrival and departure dates", { duration: 3000, position: "top-center" });
//       return;
//     }

//     if (!formData.guest_name) {
//       toast.error("Guest name is required", { duration: 3000, position: "top-center" });
//       return;
//     }

//     setIsSaving(true);
//     const loadingToast = toast.loading(
//       isEditMode ? "Updating invoice..." : "Creating invoice...",
//       { position: "top-center" }
//     );
    
//     try {
//       const calculatedSummary = calculateFinalSummary(formData);
//       console.log("🧮 Calculated Summary:", calculatedSummary);
      
//       const invoicePayload = mapToTurkeyInvoiceSchema(formData, calculatedSummary);
      
//       console.log("💾 Saving invoice payload:", invoicePayload);
      
//       let response;
//       if (isEditMode) {
//         response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
//       } else {
//         response = await turkeyInvoiceApi.createInvoice(invoicePayload);
//       }
      
//       toast.dismiss(loadingToast);
      
//       setSavedInvoiceData({
//         isEdit: isEditMode,
//         invoiceNumber: formData.company_name || (isEditMode ? invoiceId.substring(0, 8) : 'NEW'),
//         status: formData.status,
//         grandTotal: calculatedSummary.total_including_vat_kdv_dahil || calculatedSummary.grand_total,
//         currency: hotelConfig.currency
//       });
      
//       setTimeout(() => {
//         const modalElement = document.getElementById('success_modal');
//         if (modalElement) {
//           modalElement.showModal();
//         } else {
//           toast.success("Invoice saved successfully!", { duration: 2000 });
//           setTimeout(() => navigate("/invoices"), 1500);
//         }
//       }, 100);
      
//     } catch (error) {
//       toast.dismiss(loadingToast);
      
//       let errorMessage = "Failed to save invoice";
//       if (error.response?.data?.detail) {
//         if (Array.isArray(error.response.data.detail)) {
//           errorMessage = error.response.data.detail.map(err => 
//             `${err.loc?.join('.')}: ${err.msg}`
//           ).join(', ');
//         } else {
//           errorMessage = error.response.data.detail;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       toast.error(errorMessage, { duration: 6000, position: "top-center" });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleModalClose = () => {
//     navigate("/invoices");
//   };

//   const handleCancel = () => {
//     if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
//       navigate("/invoices");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
//         <div className="text-center">
//           <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
//           <p className="text-slate-600 text-lg">
//             {isEditMode ? "Loading invoice..." : "Loading hotel configuration..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] p-6">
//         <div className="max-w-3xl mx-auto">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
//             <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
//             <div>
//               <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
//               <p className="text-red-700">{error}</p>
//               <button
//                 onClick={() => navigate("/invoices")}
//                 className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
//               >
//                 Back to Invoices
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!hotelConfig) return null;

//   return (
//     <div className="min-h-screen bg-[#f8fafc] pb-32">
//       <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
//         <div className="mb-6 md:mb-8">
//           <button
//             onClick={() => navigate("/invoices")}
//             className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
//           >
//             <ArrowLeft size={20} />
//             <span className="text-sm font-medium">Back to Invoices</span>
//           </button>
          
//           <h1 className="text-xl md:text-2xl font-bold text-slate-800">
//             {isEditMode ? "Edit Invoice" : "Create New Invoice"}
//           </h1>
//           <p className="text-slate-500 text-sm mt-1">
//             {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
//             {isGrandAras && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Grand Aras Mode</span>}
//           </p>
//         </div>

//         {dateError && (
//           <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//             <p className="text-red-800 font-medium text-sm">{dateError}</p>
//           </div>
//         )}

//         <div className="space-y-4 md:space-y-6">
//           <DynamicFormSection
//             title="Invoice Information"
//             fields={hotelConfig.form_fields || []}
//             formData={formData}
//             onFieldChange={handleFieldChange}
//             dateError={dateError}
//           />

//           {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
//             if (!section.enabled) return null;

//             return (
//               <DynamicConditionalSection
//                 key={sectionKey}
//                 sectionKey={sectionKey}
//                 section={section}
//                 formData={formData}
//                 onFieldChange={handleFieldChange}
//                 setFormData={setFormData}
//               />
//             );
//           })}

//           <DynamicSummarySection
//             config={hotelConfig}
//             formData={formData}
//             onStatusChange={handleStatusChange}
//             onNoteChange={handleNoteChange}
//           />
//         </div>

//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
//           <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
//             <button
//               onClick={handleCancel}
//               disabled={isSaving}
//               className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               Cancel
//             </button>

//             <button
//               onClick={handleSave}
//               disabled={isSaving || !!dateError}
//               className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isSaving ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   {isEditMode ? "Updating..." : "Saving..."}
//                 </>
//               ) : (
//                 <>
//                   <Save size={16} />
//                   {isEditMode ? "Update Invoice" : "Save Invoice"}
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {savedInvoiceData && (
//         <SuccessModal
//           isEdit={savedInvoiceData.isEdit}
//           invoiceNumber={savedInvoiceData.invoiceNumber}
//           status={savedInvoiceData.status}
//           grandTotal={savedInvoiceData.grandTotal}
//           currency={savedInvoiceData.currency}
//           onClose={handleModalClose}
//         />
//       )}
//     </div>
//   );
// }


// DynamicInvoiceFormPage.jsx  working second last
// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
// import toast from "react-hot-toast";
// import { getHotelConfigById, getHotelConfigs } from "../Api/hotelConfig.api";
// import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// import {
//   DynamicConditionalSection,
//   DynamicFormSection,
//   DynamicSummarySection,
//   SuccessModal
// } from '../components';
// import { detectHotelType, mapToBackendSchema, calculateFinalSummary } from "../utils/invoiceCalculations";

// export default function DynamicInvoiceFormPage() {
//   const navigate = useNavigate();
//   const params = useParams();
  
//   const isEditMode = Boolean(params.invoiceId && !params.hotelId);
//   const invoiceId = params.invoiceId;
//   const hotelIdFromRoute = params.hotelId;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hotelConfig, setHotelConfig] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [dateError, setDateError] = useState("");
//   const [formData, setFormData] = useState({});
//   const [savedInvoiceData, setSavedInvoiceData] = useState(null);

//   // Load invoice or hotel config on mount
//   useEffect(() => {
//     if (isEditMode && invoiceId) {
//       loadInvoiceAndConfig();
//     } else if (hotelIdFromRoute) {
//       loadHotelConfig(hotelIdFromRoute);
//     }
//   }, [isEditMode, invoiceId, hotelIdFromRoute]);

//   // Auto-calculate nights from dates
//   useEffect(() => {
//     if (!formData.arrival_date || !formData.departure_date) return;

//     const arrival = new Date(formData.arrival_date);
//     const departure = new Date(formData.departure_date);
    
//     if (departure <= arrival) {
//       setDateError("Departure date must be after arrival date");
//       if (formData.accommodation_details?.total_nights) {
//         setFormData(prev => ({
//           ...prev,
//           accommodation_details: {
//             ...prev.accommodation_details,
//             total_nights: 0
//           }
//         }));
//       }
//       return;
//     }
    
//     setDateError("");
//     const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

//     if (formData.accommodation_details) {
//       setFormData(prev => ({
//         ...prev,
//         accommodation_details: {
//           ...prev.accommodation_details,
//           total_nights: diffDays
//         }
//       }));
//     }
//   }, [formData.arrival_date, formData.departure_date]);

//   const loadInvoiceAndConfig = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
//       let invoiceData = invoiceResponse.data || invoiceResponse;
      
//       // Handle nested data structure
//       if (invoiceData.data?.data) {
//         invoiceData.data = invoiceData.data.data;
//       }

//       const data = invoiceData.data || invoiceData;
//       const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";
      
//       // Get all hotel configs
//       const allConfigsResponse = await getHotelConfigs();
//       const allConfigs = allConfigsResponse.data || allConfigsResponse || [];
      
//       let hotelConfig = allConfigs.find(config => config.hotel_name === hotelName);
      
//       if (!hotelConfig && allConfigs.length > 0) {
//         hotelConfig = allConfigs[0];
//       }
      
//       if (!hotelConfig) {
//         throw new Error(`No hotel configuration found`);
//       }
      
//       setHotelConfig(hotelConfig);
      
//       // Map invoice data to form
//       const mappedData = mapInvoiceToForm(invoiceData, hotelConfig);
//       setFormData(mappedData);
      
//       toast.success("Invoice loaded successfully", {
//         duration: 2000,
//         icon: "📄"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load invoice");
//       toast.error(err.message || "Failed to load invoice", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadHotelConfig = async (hotelId) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await getHotelConfigById(hotelId);
//       setHotelConfig(response);
//       initializeFormData(response);
      
//       toast.success("Hotel configuration loaded", {
//         duration: 2000,
//         icon: "🏨"
//       });
//     } catch (err) {
//       setError(err.message || "Failed to load hotel configuration");
//       toast.error(err.message || "Failed to load hotel configuration", {
//         duration: 4000
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Updated mapInvoiceToForm function for DynamicInvoiceFormPage.jsx
// // This replaces the existing mapInvoiceToForm function

// const mapInvoiceToForm = (invoiceData, hotelConfig) => {
//   // Extract data from nested structure
//   let data = invoiceData;
//   if (data?.data) data = data.data;
//   if (data?.data) data = data.data;
  
//   const hotelType = detectHotelType(hotelConfig);
//   const isGrandAras = hotelType === 'GRAND_ARAS';
  
//   const accommodationConfig = hotelConfig?.conditional_sections?.accommodation_details;
//   const servicesConfig = hotelConfig?.conditional_sections?.other_services;
  
//   // Build accommodation details dynamically based on config
//   const accommodationDetails = {};
  
//   if (accommodationConfig?.fields) {
//     accommodationConfig.fields.forEach(field => {
//       const fieldId = field.field_id;
//       let value = null;
      
//       // Try direct match first
//       if (data[fieldId] !== undefined) {
//         value = data[fieldId];
//       }
//       // Common field aliases
//       else if (fieldId === 'eur_amount' && data.actualRate !== undefined) {
//         value = data.actualRate;
//       }
//       else if (fieldId === 'exchange_rate' && data.exchangeRate !== undefined) {
//         value = data.exchangeRate;
//       }
//       else if (fieldId === 'total_nights' && data.nights !== undefined) {
//         value = data.nights;
//       }
//       // Grand Aras specific fields
//       else if (fieldId === 'room_amount_try') {
//         value = data.room_amount_try || data.sellingRate;
//       }
//       else if (fieldId === 'total_room_all_nights') {
//         value = data.total_room_all_nights || data.subTotal;
//       }
//       else if (fieldId === 'taxable_amount_room') {
//         value = data.taxable_amount_room || data.taxable_amount;
//       }
//       else if (fieldId === 'vat_10_percent') {
//         value = data.vat_10_percent || data.vat1_10;
//       }
//       else if (fieldId === 'accommodation_tax') {
//         value = data.accommodation_tax || data.accommodationTaxTotal;
//       }
//       // CVK specific fields
//       else if (fieldId === 'taxable_amount') {
//         value = data.taxable_amount || data.sellingRate;
//       }
//       else if (fieldId === 'total_per_night') {
//         value = data.total_per_night || data.subTotal;
//       }
//       else if (fieldId === 'vat_total_nights') {
//         value = data.vat_total_nights || data.vat7;
//       }
//       else if (fieldId === 'acc_tax_total_nights') {
//         value = data.acc_tax_total_nights || data.accommodationTaxTotal;
//       }
      
//       accommodationDetails[fieldId] = value !== null ? value : '';
//     });
//   }
  
//   // Build services array dynamically based on config
//   const otherServices = [];
  
//   if (servicesConfig?.fields && Array.isArray(data.otherServices)) {
//     data.otherServices.forEach(service => {
//       const mappedService = { id: Date.now() + Math.random() };
      
//       servicesConfig.fields.forEach(field => {
//         const fieldId = field.field_id;
        
//         if (fieldId === 'service_name' && service.name !== undefined) {
//           mappedService[fieldId] = service.name;
//         }
//         else if (fieldId === 'service_date' && service.date !== undefined) {
//           mappedService[fieldId] = service.date;
//         }
//         else if (fieldId === 'gross_amount' && service.amount !== undefined) {
//           mappedService[fieldId] = service.amount;
//         }
//         else if (fieldId === 'taxable_amount' && service.taxable_amount !== undefined) {
//           mappedService[fieldId] = service.taxable_amount;
//         }
//         else if (fieldId === 'vat_20_percent' && service.vat_20_percent !== undefined) {
//           mappedService[fieldId] = service.vat_20_percent;
//         }
//         else if (service[fieldId] !== undefined) {
//           mappedService[fieldId] = service[fieldId];
//         }
//         else {
//           mappedService[fieldId] = '';
//         }
//       });
      
//       otherServices.push(mappedService);
//     });
//   }
  
//   // ✅ FIXED: Correct field mappings for all fields including voucher_no and cash_no
//   return {
//     hotel_name: data.hotel || hotelConfig?.hotel_name || '',
//     currency: hotelConfig?.currency || 'TRY',
//     company_name: data.referenceNo || data.company_name || '',
//     guest_name: data.guestName || '',
//     arrival_date: data.arrivalDate || '',
//     departure_date: data.departureDate || '',
//     // ✅ FIXED: Map vNo to folio_number
//     folio_number: data.vNo || data.folio_number || '',
//     invoice_date: data.invoiceDate || '',
//     room_number: data.roomNo || '',
//     adults: String(data.paxAdult || 1),
//     children: String(data.paxChild || 0),
//     passport_no: data.passportNo || '',
//     user_code: data.userId || '',
//     // ✅ FIXED: Map batchNo to cash_no
//     cash_no: data.batchNo || data.cash_no || '',
//     page_number: data.pageNo || data.page_number || '',
//     // ✅ FIXED: Map voucherNo to voucher_no
//     voucher_no: data.voucherNo || data.voucher_no || '',
//     accommodation_details: accommodationDetails,
//     other_services: otherServices,
//     status: data.status || 'pending',
//     note: data.note || ''
//   };
// };



//   const initializeFormData = (config) => {
//     const initialData = {
//       hotel_name: config.hotel_name,
//       currency: config.currency,
//       status: "pending",
//       note: ""
//     };

//     // Initialize form fields
//     config.form_fields?.forEach(field => {
//       initialData[field.field_id] = "";
//     });

//     // Initialize conditional sections
//     Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
//       if (section.enabled) {
//         initialData[sectionKey] = {};
        
//         section.fields?.forEach(field => {
//           initialData[sectionKey][field.field_id] = field.fixed_value || "";
//         });

//         if (section.multiple_entries) {
//           initialData[sectionKey] = [];
//         }
//       }
//     });

//     setFormData(initialData);
//   };

//   const handleFieldChange = (fieldPath, value) => {
//     setFormData(prev => {
//       const newData = { ...prev };
//       const parts = fieldPath.split('.');
      
//       if (parts.length === 1) {
//         newData[parts[0]] = value;
//       } else if (parts.length === 2) {
//         if (!newData[parts[0]]) {
//           newData[parts[0]] = {};
//         }
//         newData[parts[0]][parts[1]] = value;
//       }
      
//       return newData;
//     });
//   };

//   const handleStatusChange = (newStatus) => {
//     setFormData(prev => ({
//       ...prev,
//       status: newStatus
//     }));
    
//     toast.success(`Status: ${newStatus}`, {
//       duration: 2000,
//       position: "bottom-right",
//       icon: newStatus === "ready" ? "✅" : "⏳"
//     });
//   };

//   const handleNoteChange = (newNote) => {
//     setFormData(prev => ({
//       ...prev,
//       note: newNote
//     }));
//   };

//   const handleSave = async () => {
//     if (dateError) {
//       toast.error("Please fix date errors before saving", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     if (!formData.arrival_date || !formData.departure_date) {
//       toast.error("Please select arrival and departure dates", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     if (!formData.guest_name) {
//       toast.error("Guest name is required", { 
//         duration: 3000, 
//         position: "top-center" 
//       });
//       return;
//     }

//     setIsSaving(true);
//     const loadingToast = toast.loading(
//       isEditMode ? "Updating invoice..." : "Creating invoice...",
//       { position: "top-center" }
//     );
    
//     try {
//       console.log("💾 Saving invoice with formData:", formData);
      
//       // Use centralized mapping function
//       const hotelType = detectHotelType(hotelConfig);
//       const invoicePayload = mapToBackendSchema(formData, hotelConfig);
      
//       console.log("📤 Backend payload:", invoicePayload);
      
//       // Calculate summary for modal display
//       const summary = calculateFinalSummary(formData, hotelType);
      
//       let response;
//       if (isEditMode) {
//         response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
//       } else {
//         response = await turkeyInvoiceApi.createInvoice(invoicePayload);
//       }
      
//       toast.dismiss(loadingToast);
      
//       setSavedInvoiceData({
//         isEdit: isEditMode,
//         invoiceNumber: formData.company_name || (isEditMode ? invoiceId.substring(0, 8) : 'NEW'),
//         status: formData.status,
//         grandTotal: summary.grand_total,
//         currency: hotelConfig.currency
//       });
      
//       setTimeout(() => {
//         const modalElement = document.getElementById('success_modal');
//         if (modalElement) {
//           modalElement.showModal();
//         } else {
//           toast.success("Invoice saved successfully!", { duration: 2000 });
//           setTimeout(() => navigate("/invoices"), 1500);
//         }
//       }, 100);
      
//     } catch (error) {
//       toast.dismiss(loadingToast);
      
//       let errorMessage = "Failed to save invoice";
//       if (error.response?.data?.detail) {
//         if (Array.isArray(error.response.data.detail)) {
//           errorMessage = error.response.data.detail.map(err => 
//             `${err.loc?.join('.')}: ${err.msg}`
//           ).join(', ');
//         } else {
//           errorMessage = error.response.data.detail;
//         }
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       toast.error(errorMessage, { 
//         duration: 6000, 
//         position: "top-center" 
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleModalClose = () => {
//     navigate("/invoices");
//   };

//   const handleCancel = () => {
//     if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
//       navigate("/invoices");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
//         <div className="text-center">
//           <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
//           <p className="text-slate-600 text-lg">
//             {isEditMode ? "Loading invoice..." : "Loading hotel configuration..."}
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#f8fafc] p-6">
//         <div className="max-w-3xl mx-auto">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
//             <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
//             <div>
//               <h3 className="text-lg font-semibold text-red-800 mb-2">Configuration Error</h3>
//               <p className="text-red-700">{error}</p>
//               <button
//                 onClick={() => navigate("/invoices")}
//                 className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
//               >
//                 Back to Invoices
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!hotelConfig) return null;

//   const hotelType = detectHotelType(hotelConfig);

//   return (
//     <div className="min-h-screen bg-[#f8fafc] pb-32">
//       <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
//         <div className="mb-6 md:mb-8">
//           <button
//             onClick={() => navigate("/invoices")}
//             className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
//           >
//             <ArrowLeft size={20} />
//             <span className="text-sm font-medium">Back to Invoices</span>
//           </button>
          
//           <h1 className="text-xl md:text-2xl font-bold text-slate-800">
//             {isEditMode ? "Edit Invoice" : "Create New Invoice"}
//           </h1>
//           <p className="text-slate-500 text-sm mt-1">
//             {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
//             {(hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') && (
//               <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
//                 {hotelType === 'TRYP' ? 'TRYP Mode' : 'Grand Aras Mode'}
//               </span>
//             )}
//           </p>
//         </div>

//         {dateError && (
//           <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//             <p className="text-red-800 font-medium text-sm">{dateError}</p>
//           </div>
//         )}

//         <div className="space-y-4 md:space-y-6">
//           <DynamicFormSection
//             title="Invoice Information"
//             fields={hotelConfig.form_fields || []}
//             formData={formData}
//             onFieldChange={handleFieldChange}
//             dateError={dateError}
//           />

//           {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
//             if (!section.enabled) return null;

//             return (
//               <DynamicConditionalSection
//                 key={sectionKey}
//                 sectionKey={sectionKey}
//                 section={section}
//                 formData={formData}
//                 onFieldChange={handleFieldChange}
//                 setFormData={setFormData}
//                 hotelConfig={hotelConfig}
//               />
//             );
//           })}

//           <DynamicSummarySection
//             config={hotelConfig}
//             formData={formData}
//             onStatusChange={handleStatusChange}
//             onNoteChange={handleNoteChange}
//           />
//         </div>

//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
//           <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
//             <button
//               onClick={handleCancel}
//               disabled={isSaving}
//               className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               Cancel
//             </button>

//             <button
//               onClick={handleSave}
//               disabled={isSaving || !!dateError}
//               className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isSaving ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin" />
//                   {isEditMode ? "Updating..." : "Saving..."}
//                 </>
//               ) : (
//                 <>
//                   <Save size={16} />
//                   {isEditMode ? "Update Invoice" : "Save Invoice"}
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>

//       {savedInvoiceData && (
//         <SuccessModal
//           isEdit={savedInvoiceData.isEdit}
//           invoiceNumber={savedInvoiceData.invoiceNumber}
//           status={savedInvoiceData.status}
//           grandTotal={savedInvoiceData.grandTotal}
//           currency={savedInvoiceData.currency}
//           onClose={handleModalClose}
//         />
//       )}
//     </div>
//   );
// }