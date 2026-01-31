// // "use client";

// // import { useState, useEffect } from "react";
// // import { useNavigate, useParams } from "react-router-dom";
// // import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
// // import toast from "react-hot-toast";
// // import { getHotelConfigById } from "../Api/hotelConfig.api";
// // import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// // import {
// //   DynamicConditionalSection,
// //   DynamicFormSection,
// //   DynamicSummarySection
// // } from '../components';

// // export default function DynamicInvoiceFormPage() {
// //   const navigate = useNavigate();
// //   const { hotelId, invoiceId } = useParams(); // Support both create and edit
// //   const isEditMode = Boolean(invoiceId);

// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [hotelConfig, setHotelConfig] = useState(null);
// //   const [isSaving, setIsSaving] = useState(false);
// //   const [dateError, setDateError] = useState("");

// //   // Dynamic form data state
// //   const [formData, setFormData] = useState({});

// //   useEffect(() => {
// //     if (hotelId) {
// //       loadHotelConfig();
// //     }
// //   }, [hotelId]);

// //   // Load existing invoice data in edit mode
// //   useEffect(() => {
// //     if (isEditMode && invoiceId && hotelConfig) {
// //       loadInvoiceData(invoiceId);
// //     }
// //   }, [isEditMode, invoiceId, hotelConfig]);

// //   // Auto-calculate total nights when dates change
// //   useEffect(() => {
// //     if (formData.arrival_date && formData.departure_date) {
// //       const arrival = new Date(formData.arrival_date);
// //       const departure = new Date(formData.departure_date);
      
// //       if (departure <= arrival) {
// //         setDateError("Departure date must be after arrival date");
        
// //         if (formData.accommodation_details?.total_nights) {
// //           setFormData(prev => ({
// //             ...prev,
// //             accommodation_details: {
// //               ...prev.accommodation_details,
// //               total_nights: 0
// //             }
// //           }));
// //         }
// //         return;
// //       } else {
// //         setDateError("");
// //       }

// //       const diffTime = Math.abs(departure - arrival);
// //       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
// //       console.log(`📅 Calculated nights: ${diffDays}`);

// //       if (formData.accommodation_details) {
// //         setFormData(prev => ({
// //           ...prev,
// //           accommodation_details: {
// //             ...prev.accommodation_details,
// //             total_nights: diffDays
// //           }
// //         }));
// //       }
// //     }
// //   }, [formData.arrival_date, formData.departure_date]);

// //   // Auto-calculate accommodation fields
// //   useEffect(() => {
// //     const acc = formData.accommodation_details;
    
// //     if (!acc) return;

// //     const eurAmount = parseFloat(acc.eur_amount) || 0;
// //     const exchangeRate = parseFloat(acc.exchange_rate) || 0;
// //     const totalNights = parseInt(acc.total_nights) || 0;

// //     if (eurAmount > 0 && exchangeRate > 0) {
// //       const taxableAmount = (eurAmount * exchangeRate) / 1.12;
// //       const vat10Percent = taxableAmount * 0.1;
// //       const accommodationTax = taxableAmount * 0.02;

// //       setFormData(prev => ({
// //         ...prev,
// //         accommodation_details: {
// //           ...prev.accommodation_details,
// //           taxable_amount: taxableAmount.toFixed(2),
// //           vat_10_percent: vat10Percent.toFixed(2),
// //           accommodation_tax: accommodationTax.toFixed(2),
// //           total_per_night: totalNights > 0 ? (totalNights * taxableAmount).toFixed(2) : "0.00",
// //           vat_total_nights: totalNights > 0 ? (totalNights * vat10Percent).toFixed(2) : "0.00",
// //           acc_tax_total_nights: totalNights > 0 ? (totalNights * accommodationTax).toFixed(2) : "0.00"
// //         }
// //       }));
// //     }
// //   }, [
// //     formData.accommodation_details?.eur_amount,
// //     formData.accommodation_details?.exchange_rate,
// //     formData.accommodation_details?.total_nights
// //   ]);

// //   // Auto-calculate other services
// //   useEffect(() => {
// //     if (!formData.other_services || !Array.isArray(formData.other_services)) return;

// //     const updatedServices = formData.other_services.map(service => {
// //       const grossAmount = parseFloat(service.gross_amount) || 0;
      
// //       if (grossAmount > 0) {
// //         const taxableAmount = grossAmount / 1.2;
// //         const vat20Percent = taxableAmount * 0.2;

// //         return {
// //           ...service,
// //           taxable_amount: taxableAmount.toFixed(2),
// //           vat_20_percent: vat20Percent.toFixed(2)
// //         };
// //       }
      
// //       return service;
// //     });

// //     const hasChanges = updatedServices.some((service, idx) => {
// //       const original = formData.other_services[idx];
// //       return service.taxable_amount !== original.taxable_amount ||
// //              service.vat_20_percent !== original.vat_20_percent;
// //     });

// //     if (hasChanges) {
// //       setFormData(prev => ({
// //         ...prev,
// //         other_services: updatedServices
// //       }));
// //     }
// //   }, [formData.other_services?.map(s => s.gross_amount).join(',')]);

// //   const loadHotelConfig = async () => {
// //     setLoading(true);
// //     setError(null);

// //     try {
// //       console.log("🔍 Loading config for hotel ID:", hotelId);
      
// //       const response = await getHotelConfigById(hotelId);
// //       console.log("✅ Hotel config loaded:", response);

// //       setHotelConfig(response);
      
// //       if (!isEditMode) {
// //         initializeFormData(response);
// //       }
// //     } catch (err) {
// //       console.error("❌ Failed to load hotel config:", err);
// //       setError(err.message || "Failed to load hotel configuration");
// //       toast.error("Could not load hotel configuration");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const loadInvoiceData = async (id) => {
// //     setLoading(true);
// //     try {
// //       console.log("🔍 Loading invoice:", id);
// //       const response = await turkeyInvoiceApi.getInvoiceById(id);
// //       console.log("✅ Invoice loaded:", response);
      
// //       const invoiceData = response.data || response;
      
// //       // Map backend data to form data
// //       setFormData({
// //         hotel_name: invoiceData.hotel || hotelConfig.hotel_name,
// //         currency: hotelConfig.currency,
// //         company_name: invoiceData.referenceNo,
// //         guest_name: invoiceData.guestName,
// //         arrival_date: invoiceData.arrivalDate,
// //         departure_date: invoiceData.departureDate,
// //         room_number: invoiceData.roomNo,
// //         folio_number: invoiceData.vNo,
// //         adults: invoiceData.paxAdult?.toString() || "1",
// //         children: invoiceData.paxChild?.toString() || "0",
// //         passport_no: invoiceData.passportNo,
// //         user_code: invoiceData.userId,
// //         cash_no: invoiceData.voucherNo,
// //         page_number: invoiceData.batchNo,
// //         invoice_date: invoiceData.invoiceDate,
// //         status: invoiceData.status || "pending",
// //         note: invoiceData.note || "",
// //         accommodation_details: {
// //           eur_amount: invoiceData.actualRate?.toString() || "0",
// //           exchange_rate: invoiceData.exchangeRate?.toString() || "0",
// //           total_nights: invoiceData.nights || 0,
// //           taxable_amount: invoiceData.sellingRate?.toString() || "0",
// //           vat_10_percent: invoiceData.vat1_10?.toString() || "0",
// //           accommodation_tax: "0",
// //           total_per_night: invoiceData.subTotal?.toString() || "0",
// //           vat_total_nights: invoiceData.vat7?.toString() || "0",
// //           acc_tax_total_nights: "0"
// //         },
// //         other_services: (invoiceData.otherServices || []).map(service => ({
// //           id: Date.now() + Math.random(),
// //           service_name: service.name,
// //           service_date: service.date,
// //           gross_amount: service.amount?.toString() || "0",
// //           taxable_amount: (service.amount / 1.2).toFixed(2),
// //           vat_20_percent: ((service.amount / 1.2) * 0.2).toFixed(2),
// //         }))
// //       });
      
// //       toast.success("Invoice loaded successfully");
// //     } catch (err) {
// //       console.error("❌ Failed to load invoice:", err);
// //       toast.error("Failed to load invoice");
// //       navigate("/invoices");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const initializeFormData = (config) => {
// //     const initialData = {
// //       hotel_name: config.hotel_name,
// //       currency: config.currency,
// //       status: "pending",
// //       note: ""
// //     };

// //     config.form_fields?.forEach(field => {
// //       initialData[field.field_id] = "";
// //     });

// //     Object.entries(config.conditional_sections || {}).forEach(([sectionKey, section]) => {
// //       if (section.enabled) {
// //         initialData[sectionKey] = {};
        
// //         section.fields?.forEach(field => {
// //           initialData[sectionKey][field.field_id] = field.fixed_value || "";
// //         });

// //         if (section.multiple_entries) {
// //           initialData[sectionKey] = [];
// //         }
// //       }
// //     });

// //     setFormData(initialData);
// //     console.log("📝 Initialized form data:", initialData);
// //   };

// //   const handleFieldChange = (fieldPath, value) => {
// //     console.log("🔄 Field change:", fieldPath, "=", value);
    
// //     setFormData(prev => {
// //       const newData = { ...prev };
// //       const parts = fieldPath.split('.');
      
// //       if (parts.length === 1) {
// //         newData[parts[0]] = value;
// //       } else if (parts.length === 2) {
// //         if (!newData[parts[0]]) {
// //           newData[parts[0]] = {};
// //         }
// //         newData[parts[0]][parts[1]] = value;
// //       }
      
// //       return newData;
// //     });
// //   };

// //   const handleStatusChange = (newStatus) => {
// //     setFormData(prev => ({
// //       ...prev,
// //       status: newStatus
// //     }));
// //   };

// //   const handleNoteChange = (newNote) => {
// //     setFormData(prev => ({
// //       ...prev,
// //       note: newNote
// //     }));
// //   };

// //   // Map dynamic formData to Turkey Invoice API format
// //   const mapToTurkeyInvoiceSchema = (dynamicData, calculatedSummary) => {
// //     const toFixed2 = (value) => {
// //       const num = parseFloat(value || 0);
// //       return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
// //     };

// //     const capitalizeWords = (str) => {
// //       if (!str) return "";
// //       return str
// //         .trim()
// //         .replace(/\s+/g, " ")
// //         .split(" ")
// //         .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
// //         .join(" ");
// //     };

// //     const acc = dynamicData.accommodation_details || {};
// //     const totalNights = parseInt(acc.total_nights) || 0;
    
// //     const formatDate = (dateStr) => {
// //       if (!dateStr) return new Date().toISOString().split("T")[0];
// //       return dateStr.split("T")[0];
// //     };

// //     return {
// //       data: {
// //         referenceNo: dynamicData.company_name || `INV-${Date.now()}`,
// //         invoiceDate: formatDate(dynamicData.invoice_date),
// //         guestName: capitalizeWords(dynamicData.guest_name) || "Guest",
// //         hotel: dynamicData.hotel_name || "Hotel",
// //         vd: dynamicData.room_number || "",
// //         vNo: dynamicData.folio_number || "",
// //         roomNo: dynamicData.room_number || "",
// //         paxAdult: parseInt(dynamicData.adults) || 1,
// //         paxChild: parseInt(dynamicData.children) || 0,
// //         ratePlan: "",
// //         arrivalDate: formatDate(dynamicData.arrival_date),
// //         departureDate: formatDate(dynamicData.departure_date),
// //         nights: totalNights,
// //         confirmation: dynamicData.passport_no || "",
// //         passportNo: dynamicData.passport_no || "",
// //         voucherNo: dynamicData.cash_no || "",
// //         userId: dynamicData.user_code || "",
// //         batchNo: dynamicData.page_number || "",
// //         actualRate: toFixed2(acc.eur_amount),
// //         exchangeRate: toFixed2(acc.exchange_rate) || 1.0,
// //         sellingRate: toFixed2(acc.taxable_amount),
// //         newRoomRate: toFixed2(acc.taxable_amount),
// //         vat1_10: toFixed2(acc.vat_10_percent),
// //         vat7: toFixed2(acc.vat_total_nights),
// //         vat20: 0.0,
// //         vat5: 0.0,
// //         newVat1_10: 0.0,
// //         newVat7: 0.0,
// //         newVat20: 0.0,
// //         newVat5: 0.0,
// //         cityTaxRows: 0,
// //         cityTaxAmount: 0.0,
// //         stampTaxRows: 0,
// //         stampTaxAmount: 0.0,
// //         subTotal: toFixed2(calculatedSummary.total_amount || acc.total_per_night),
// //         vatTotal: toFixed2(calculatedSummary.total_vat_10 || acc.vat_total_nights),
// //         stampTaxTotal: 0.0,
// //         cityTaxTotal: 0.0,
// //         grandTotal: toFixed2(calculatedSummary.total_including_vat_kdv_dahil || 0),
// //         status: dynamicData.status || "pending",
// //         note: dynamicData.note || "",
// //         accommodationDetails: totalNights > 0 ? Array.from({ length: totalNights }, (_, i) => ({
// //           day: i + 1,
// //           date: formatDate(new Date(new Date(dynamicData.arrival_date).getTime() + i * 86400000).toISOString()),
// //           description: "Hébergement / Accommodation",
// //           rate: toFixed2(acc.taxable_amount || 0),
// //         })) : [],
// //         cityTaxDetails: [],
// //         stampTaxDetails: [],
// //         otherServices: (dynamicData.other_services || []).map(service => ({
// //           name: capitalizeWords(service.service_name) || "Service",
// //           date: formatDate(service.service_date),
// //           amount: toFixed2(service.gross_amount),
// //           textField1: "",
// //           textField2: "",
// //         })),
// //       }
// //     };
// //   };

// //   const calculateFinalSummary = (data) => {
// //     const acc = data.accommodation_details || {};
// //     const services = data.other_services || [];
    
// //     const accTotal = parseFloat(acc.total_per_night) || 0;
// //     const accVat = parseFloat(acc.vat_total_nights) || 0;
// //     const accTax = parseFloat(acc.acc_tax_total_nights) || 0;
    
// //     const servicesTotal = services.reduce((sum, s) => sum + (parseFloat(s.taxable_amount) || 0), 0);
// //     const servicesVat = services.reduce((sum, s) => sum + (parseFloat(s.vat_20_percent) || 0), 0);
    
// //     const totalAmount = accTotal + servicesTotal;
// //     const totalVat = accVat + servicesVat;
// //     const totalIncludingVat = totalAmount + totalVat + accTax;
// //     const totalInEur = totalIncludingVat / (parseFloat(acc.exchange_rate) || 1);
    
// //     return {
// //       total_amount: totalAmount,
// //       total_vat_10: totalVat,
// //       total_acc_tax: accTax,
// //       total_including_vat_kdv_dahil: totalIncludingVat,
// //       total_in_eur: totalInEur
// //     };
// //   };

// //   const handleSave = async () => {
// //     if (dateError) {
// //       toast.error("Please fix date errors before saving");
// //       return;
// //     }

// //     if (!formData.arrival_date || !formData.departure_date) {
// //       toast.error("Please select arrival and departure dates");
// //       return;
// //     }

// //     if (!formData.guest_name) {
// //       toast.error("Guest name is required");
// //       return;
// //     }

// //     setIsSaving(true);
    
// //     try {
// //       console.log("💾 Saving Turkey invoice with data:", formData);
      
// //       const calculatedSummary = calculateFinalSummary(formData);
// //       console.log("📊 Calculated summary:", calculatedSummary);
      
// //       const invoicePayload = mapToTurkeyInvoiceSchema(formData, calculatedSummary);
// //       console.log("🔄 Mapped to Turkey invoice schema:", invoicePayload);
      
// //       let response;
// //       if (isEditMode) {
// //         response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
// //         toast.success("Invoice updated successfully!");
// //       } else {
// //         response = await turkeyInvoiceApi.createInvoice(invoicePayload);
// //         toast.success("Invoice created successfully!");
// //       }
      
// //       console.log("✅ API Response:", response);
      
// //       setTimeout(() => {
// //         navigate("/invoices");
// //       }, 1000);
      
// //     } catch (error) {
// //       console.error("❌ Error saving Turkey invoice:", error);
      
// //       if (error.response?.data?.detail) {
// //         toast.error(error.response.data.detail);
// //       } else {
// //         toast.error(error.message || "Failed to save invoice");
// //       }
// //     } finally {
// //       setIsSaving(false);
// //     }
// //   };

// //   const handleCancel = () => {
// //     if (window.confirm("Are you sure you want to cancel? All changes will be lost.")) {
// //       navigate("/invoices");
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
// //         <div className="text-center">
// //           <Loader2 size={48} className="animate-spin text-[#003d7a] mx-auto mb-4" />
// //           <p className="text-slate-600 text-lg">
// //             {isEditMode ? "Loading invoice..." : "Loading hotel configuration..."}
// //           </p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="min-h-screen bg-[#f8fafc] p-6">
// //         <div className="max-w-3xl mx-auto">
// //           <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
// //             <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
// //             <div>
// //               <h3 className="text-lg font-semibold text-red-800 mb-2">
// //                 Configuration Error
// //               </h3>
// //               <p className="text-red-700">{error}</p>
// //               <button
// //                 onClick={() => navigate("/invoices")}
// //                 className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
// //               >
// //                 Back to Invoices
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (!hotelConfig) {
// //     return null;
// //   }

// //   return (
// //     <div className="min-h-screen bg-[#f8fafc] pb-32">
// //       <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
// //         <div className="mb-6 md:mb-8">
// //           <button
// //             onClick={() => navigate("/invoices")}
// //             className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
// //           >
// //             <ArrowLeft size={20} />
// //             <span className="text-sm font-medium">Back to Invoices</span>
// //           </button>
          
// //           <h1 className="text-xl md:text-2xl font-bold text-slate-800">
// //             {isEditMode ? "Edit Invoice" : "Create New Invoice"}
// //           </h1>
// //           <p className="text-slate-500 text-sm mt-1">
// //             {hotelConfig.hotel_name} • Currency: {hotelConfig.currency}
// //           </p>
// //         </div>

// //         {dateError && (
// //           <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
// //             <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
// //             <div>
// //               <p className="text-red-800 font-medium text-sm">{dateError}</p>
// //             </div>
// //           </div>
// //         )}

// //         <div className="space-y-4 md:space-y-6">
// //           <DynamicFormSection
// //             title="Invoice Information"
// //             fields={hotelConfig.form_fields || []}
// //             formData={formData}
// //             onFieldChange={handleFieldChange}
// //             dateError={dateError}
// //           />

// //           {Object.entries(hotelConfig.conditional_sections || {}).map(([sectionKey, section]) => {
// //             if (!section.enabled) return null;

// //             return (
// //               <DynamicConditionalSection
// //                 key={sectionKey}
// //                 sectionKey={sectionKey}
// //                 section={section}
// //                 formData={formData}
// //                 onFieldChange={handleFieldChange}
// //                 setFormData={setFormData}
// //               />
// //             );
// //           })}

// //           <DynamicSummarySection
// //             config={hotelConfig}
// //             formData={formData}
// //             onStatusChange={handleStatusChange}
// //             onNoteChange={handleNoteChange}
// //           />
// //         </div>

// //         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
// //           <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
// //             <button
// //               onClick={handleCancel}
// //               disabled={isSaving}
// //               className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
// //             >
// //               Cancel
// //             </button>

// //             <button
// //               onClick={handleSave}
// //               disabled={isSaving || !!dateError}
// //               className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
// //             >
// //               {isSaving ? (
// //                 <>
// //                   <Loader2 size={16} className="animate-spin" />
// //                   {isEditMode ? "Updating..." : "Saving..."}
// //                 </>
// //               ) : (
// //                 <>
// //                   <Save size={16} />
// //                   {isEditMode ? "Update Invoice" : "Save Invoice"}
// //                 </>
// //               )}
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }



// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Loader2, AlertCircle, Save } from "lucide-react";
// import toast from "react-hot-toast";
// import { getHotelConfigById } from "../Api/hotelConfig.api";
// import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// import {
//   DynamicConditionalSection,
//   DynamicFormSection,
//   DynamicSummarySection
// } from '../components';

// export default function DynamicInvoiceFormPage() {
//   const navigate = useNavigate();
//   const params = useParams();
  
//   // Determine mode: if we have hotelId in params, it's create mode
//   // if we have invoiceId, it's edit mode
//   const isEditMode = Boolean(params.invoiceId && !params.hotelId);
//   const invoiceId = params.invoiceId;
//   const hotelIdFromRoute = params.hotelId;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [hotelConfig, setHotelConfig] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [dateError, setDateError] = useState("");
//   const [formData, setFormData] = useState({});

//   useEffect(() => {
//     if (isEditMode && invoiceId) {
//       // Edit mode: Load invoice first, then load config
//       loadInvoiceAndConfig();
      
//     } else if (hotelIdFromRoute) {
//       // Create mode: Load config directly
//       loadHotelConfig(hotelIdFromRoute);
//     }
//   }, [isEditMode, invoiceId, hotelIdFromRoute]);

//   // Auto-calculate total nights when dates change
//   useEffect(() => {
//     if (formData.arrival_date && formData.departure_date) {
//       const arrival = new Date(formData.arrival_date);
//       const departure = new Date(formData.departure_date);
      
//       if (departure <= arrival) {
//         setDateError("Departure date must be after arrival date");
        
//         if (formData.accommodation_details?.total_nights) {
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
      
//       console.log(`📅 Calculated nights: ${diffDays}`);

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

//   // Auto-calculate accommodation fields
//   useEffect(() => {
//     const acc = formData.accommodation_details;
    
//     if (!acc) return;

//     const eurAmount = parseFloat(acc.eur_amount) || 0;
//     const exchangeRate = parseFloat(acc.exchange_rate) || 0;
//     const totalNights = parseInt(acc.total_nights) || 0;

//     if (eurAmount > 0 && exchangeRate > 0) {
//       const taxableAmount = (eurAmount * exchangeRate) / 1.12;
//       const vat10Percent = taxableAmount * 0.1;
//       const accommodationTax = taxableAmount * 0.02;

//       setFormData(prev => ({
//         ...prev,
//         accommodation_details: {
//           ...prev.accommodation_details,
//           taxable_amount: taxableAmount.toFixed(2),
//           vat_10_percent: vat10Percent.toFixed(2),
//           accommodation_tax: accommodationTax.toFixed(2),
//           total_per_night: totalNights > 0 ? (totalNights * taxableAmount).toFixed(2) : "0.00",
//           vat_total_nights: totalNights > 0 ? (totalNights * vat10Percent).toFixed(2) : "0.00",
//           acc_tax_total_nights: totalNights > 0 ? (totalNights * accommodationTax).toFixed(2) : "0.00"
//         }
//       }));
//     }
//   }, [
//     formData.accommodation_details?.eur_amount,
//     formData.accommodation_details?.exchange_rate,
//     formData.accommodation_details?.total_nights
//   ]);

//   // Auto-calculate other services
//   useEffect(() => {
//     if (!formData.other_services || !Array.isArray(formData.other_services)) return;

//     const updatedServices = formData.other_services.map(service => {
//       const grossAmount = parseFloat(service.gross_amount) || 0;
      
//       if (grossAmount > 0) {
//         const taxableAmount = grossAmount / 1.2;
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

//   // Helper to get hotel ID from name
//   const getHotelIdFromName = (hotelName) => {
//     const hotelMapping = {
//       "CVK Park Bosphorus Hotel Istanbul": "cvk-bosphorus",
//       "Novotel Tunis": "novotel-tunis",
//     };
//     return hotelMapping[hotelName] || "cvk-bosphorus";
//   };

//   const loadInvoiceAndConfig = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       console.log("🔍 Loading invoice:", invoiceId);
      
//       // Load invoice data first
//       const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
//       const invoiceData = invoiceResponse.data || invoiceResponse;
      
//       console.log("✅ Invoice loaded:", invoiceData);

//       // Get hotel name and find config
//       const hotelName = invoiceData.data?.hotel || invoiceData.hotel;
//       const hotelId = getHotelIdFromName(hotelName);

//       console.log("🔍 Loading hotel config:", hotelId);
//       const configResponse = await getHotelConfigById(hotelId);
//       console.log("✅ Hotel config loaded:", configResponse);

//       setHotelConfig(configResponse);
      
//       // Map invoice data to form
//       mapInvoiceToForm(invoiceData, configResponse);
      
//       toast.success("Invoice loaded successfully");
//     } catch (err) {
//       console.error("❌ Failed to load invoice/config:", err);
//       setError(err.message || "Failed to load invoice");
//       toast.error("Failed to load invoice");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadHotelConfig = async (hotelId) => {
//     setLoading(true);
//     setError(null);

//     try {
//       console.log("🔍 Loading config for hotel ID:", hotelId);
      
//       const response = await getHotelConfigById(hotelId);
//       console.log("✅ Hotel config loaded:", response);

//       setHotelConfig(response);
//       initializeFormData(response);
//     } catch (err) {
//       console.error("❌ Failed to load hotel config:", err);
//       setError(err.message || "Failed to load hotel configuration");
//       toast.error("Could not load hotel configuration");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const mapInvoiceToForm = (invoiceData, config) => {
//     const data = invoiceData.data || invoiceData;
    
//     setFormData({
//       hotel_name: data.hotel || config.hotel_name,
//       currency: config.currency,
//       company_name: data.referenceNo,
//       guest_name: data.guestName,
//       arrival_date: data.arrivalDate,
//       departure_date: data.departureDate,
//       room_number: data.roomNo,
//       folio_number: data.vNo,
//       adults: data.paxAdult?.toString() || "1",
//       children: data.paxChild?.toString() || "0",
//       passport_no: data.passportNo,
//       user_code: data.userId,
//       cash_no: data.voucherNo,
//       page_number: data.batchNo,
//       invoice_date: data.invoiceDate,
//       status: data.status || "pending",
//       note: data.note || "",
//       accommodation_details: {
//         eur_amount: data.actualRate?.toString() || "0",
//         exchange_rate: data.exchangeRate?.toString() || "0",
//         total_nights: data.nights || 0,
//         taxable_amount: data.sellingRate?.toString() || "0",
//         vat_10_percent: data.vat1_10?.toString() || "0",
//         accommodation_tax: "0",
//         total_per_night: data.subTotal?.toString() || "0",
//         vat_total_nights: data.vat7?.toString() || "0",
//         acc_tax_total_nights: "0"
//       },
//       other_services: (data.otherServices || []).map(service => ({
//         id: Date.now() + Math.random(),
//         service_name: service.name,
//         service_date: service.date,
//         gross_amount: service.amount?.toString() || "0",
//         taxable_amount: (service.amount / 1.2).toFixed(2),
//         vat_20_percent: ((service.amount / 1.2) * 0.2).toFixed(2),
//       }))
//     });
//   };

//   const initializeFormData = (config) => {
//     const initialData = {
//       hotel_name: config.hotel_name,
//       currency: config.currency,
//       status: "pending",
//       note: ""
//     };

//     config.form_fields?.forEach(field => {
//       initialData[field.field_id] = "";
//     });

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
//     console.log("📝 Initialized form data:", initialData);
//   };

//   const handleFieldChange = (fieldPath, value) => {
//     console.log("🔄 Field change:", fieldPath, "=", value);
    
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
//   };

//   const handleNoteChange = (newNote) => {
//     setFormData(prev => ({
//       ...prev,
//       note: newNote
//     }));
//   };

//   // Map dynamic formData to Turkey Invoice API format
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

//     return {
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
//         sellingRate: toFixed2(acc.taxable_amount),
//         newRoomRate: toFixed2(acc.taxable_amount),
//         vat1_10: toFixed2(acc.vat_10_percent),
//         vat7: toFixed2(acc.vat_total_nights),
//         vat20: 0.0,
//         vat5: 0.0,
//         newVat1_10: 0.0,
//         newVat7: 0.0,
//         newVat20: 0.0,
//         newVat5: 0.0,
//         cityTaxRows: 0,
//         cityTaxAmount: 0.0,
//         stampTaxRows: 0,
//         stampTaxAmount: 0.0,
//         subTotal: toFixed2(calculatedSummary.total_amount || acc.total_per_night),
//         vatTotal: toFixed2(calculatedSummary.total_vat_10 || acc.vat_total_nights),
//         stampTaxTotal: 0.0,
//         cityTaxTotal: 0.0,
//         grandTotal: toFixed2(calculatedSummary.total_including_vat_kdv_dahil || 0),
//         status: dynamicData.status || "pending",
//         note: dynamicData.note || "",
//         accommodationDetails: totalNights > 0 ? Array.from({ length: totalNights }, (_, i) => ({
//           day: i + 1,
//           date: formatDate(new Date(new Date(dynamicData.arrival_date).getTime() + i * 86400000).toISOString()),
//           description: "Hébergement / Accommodation",
//           rate: toFixed2(acc.taxable_amount || 0),
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
//   };

//   const calculateFinalSummary = (data) => {
//     const acc = data.accommodation_details || {};
//     const services = data.other_services || [];
    
//     const accTotal = parseFloat(acc.total_per_night) || 0;
//     const accVat = parseFloat(acc.vat_total_nights) || 0;
//     const accTax = parseFloat(acc.acc_tax_total_nights) || 0;
    
//     const servicesTotal = services.reduce((sum, s) => sum + (parseFloat(s.taxable_amount) || 0), 0);
//     const servicesVat = services.reduce((sum, s) => sum + (parseFloat(s.vat_20_percent) || 0), 0);
    
//     const totalAmount = accTotal + servicesTotal;
//     const totalVat = accVat + servicesVat;
//     const totalIncludingVat = totalAmount + totalVat + accTax;
//     const totalInEur = totalIncludingVat / (parseFloat(acc.exchange_rate) || 1);
    
//     return {
//       total_amount: totalAmount,
//       total_vat_10: totalVat,
//       total_acc_tax: accTax,
//       total_including_vat_kdv_dahil: totalIncludingVat,
//       total_in_eur: totalInEur
//     };
//   };

//   const handleSave = async () => {
//     if (dateError) {
//       toast.error("Please fix date errors before saving");
//       return;
//     }

//     if (!formData.arrival_date || !formData.departure_date) {
//       toast.error("Please select arrival and departure dates");
//       return;
//     }

//     if (!formData.guest_name) {
//       toast.error("Guest name is required");
//       return;
//     }

//     setIsSaving(true);
    
//     try {
//       console.log("💾 Saving Turkey invoice with data:", formData);
      
//       const calculatedSummary = calculateFinalSummary(formData);
//       console.log("📊 Calculated summary:", calculatedSummary);
      
//       const invoicePayload = mapToTurkeyInvoiceSchema(formData, calculatedSummary);
//       console.log("🔄 Mapped to Turkey invoice schema:", invoicePayload);
      
//       let response;
//       if (isEditMode) {
//         response = await turkeyInvoiceApi.updateInvoice(invoiceId, invoicePayload);
//         toast.success("✅ Invoice updated successfully!", {
//           duration: 3000,
//           icon: "🎉"
//         });
//       } else {
//         response = await turkeyInvoiceApi.createInvoice(invoicePayload);
//         toast.success("✅ Invoice created successfully!", {
//           duration: 3000,
//           icon: "🎉"
//         });
//       }
      
//       console.log("✅ API Response:", response);
      
//       setTimeout(() => {
//         navigate("/invoices");
//       }, 1500);
      
//     } catch (error) {
//       console.error("❌ Error saving Turkey invoice:", error);
      
//       if (error.response?.data?.detail) {
//         toast.error(error.response.data.detail);
//       } else {
//         toast.error(error.message || "Failed to save invoice");
//       }
//     } finally {
//       setIsSaving(false);
//     }
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
//               <h3 className="text-lg font-semibold text-red-800 mb-2">
//                 Configuration Error
//               </h3>
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

//   if (!hotelConfig) {
//     return null;
//   }

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
//             <div>
//               <p className="text-red-800 font-medium text-sm">{dateError}</p>
//             </div>
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
//     </div>
//   );
// }


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

  useEffect(() => {
    if (isEditMode && invoiceId) {
      loadInvoiceAndConfig();
    } else if (hotelIdFromRoute) {
      loadHotelConfig(hotelIdFromRoute);
    }
  }, [isEditMode, invoiceId, hotelIdFromRoute]);

  useEffect(() => {
    if (formData.arrival_date && formData.departure_date) {
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
      } else {
        setDateError("");
      }

      const diffTime = Math.abs(departure - arrival);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (formData.accommodation_details) {
        setFormData(prev => ({
          ...prev,
          accommodation_details: {
            ...prev.accommodation_details,
            total_nights: diffDays
          }
        }));
      }
    }
  }, [formData.arrival_date, formData.departure_date]);

  useEffect(() => {
    const acc = formData.accommodation_details;
    if (!acc) return;

    const eurAmount = parseFloat(acc.eur_amount) || 0;
    const exchangeRate = parseFloat(acc.exchange_rate) || 0;
    const totalNights = parseInt(acc.total_nights) || 0;

    if (eurAmount > 0 && exchangeRate > 0) {
      const taxableAmount = (eurAmount * exchangeRate) / 1.12;
      const vat10Percent = taxableAmount * 0.1;
      const accommodationTax = taxableAmount * 0.02;

      setFormData(prev => ({
        ...prev,
        accommodation_details: {
          ...prev.accommodation_details,
          taxable_amount: taxableAmount.toFixed(2),
          vat_10_percent: vat10Percent.toFixed(2),
          accommodation_tax: accommodationTax.toFixed(2),
          total_per_night: totalNights > 0 ? (totalNights * taxableAmount).toFixed(2) : "0.00",
          vat_total_nights: totalNights > 0 ? (totalNights * vat10Percent).toFixed(2) : "0.00",
          acc_tax_total_nights: totalNights > 0 ? (totalNights * accommodationTax).toFixed(2) : "0.00"
        }
      }));
    }
  }, [
    formData.accommodation_details?.eur_amount,
    formData.accommodation_details?.exchange_rate,
    formData.accommodation_details?.total_nights
  ]);

  useEffect(() => {
    if (!formData.other_services || !Array.isArray(formData.other_services)) return;

    const updatedServices = formData.other_services.map(service => {
      const grossAmount = parseFloat(service.gross_amount) || 0;
      
      if (grossAmount > 0) {
        const taxableAmount = grossAmount / 1.2;
        const vat20Percent = taxableAmount * 0.2;

        return {
          ...service,
          taxable_amount: taxableAmount.toFixed(2),
          vat_20_percent: vat20Percent.toFixed(2)
        };
      }
      
      return service;
    });

    const hasChanges = updatedServices.some((service, idx) => {
      const original = formData.other_services[idx];
      return service.taxable_amount !== original.taxable_amount ||
             service.vat_20_percent !== original.vat_20_percent;
    });

    if (hasChanges) {
      setFormData(prev => ({
        ...prev,
        other_services: updatedServices
      }));
    }
  }, [formData.other_services?.map(s => s.gross_amount).join(',')]);

  const loadInvoiceAndConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const invoiceResponse = await turkeyInvoiceApi.getInvoiceById(invoiceId);
      let invoiceData = invoiceResponse.data || invoiceResponse;
      
      if (invoiceData.data && invoiceData.data.data) {
        invoiceData.data = invoiceData.data.data;
      }

      const data = invoiceData.data || invoiceData;
      const hotelName = data.hotel || "CVK Park Bosphorus Hotel Istanbul";
      
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
      mapInvoiceToForm(invoiceData, hotelConfig);
      
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

  const mapInvoiceToForm = (invoiceData, config) => {
    let data = invoiceData.data || invoiceData;
    
    if (data.data && typeof data.data === 'object') {
      data = data.data;
    }
    
    const taxableAmount = parseFloat(data.sellingRate) || 0;
    const totalNights = parseInt(data.nights) || 0;
    const accommodationTaxPerNight = taxableAmount * 0.02;
    const totalAccommodationTax = accommodationTaxPerNight * totalNights;
    
    const mappedFormData = {
      hotel_name: data.hotel || config.hotel_name,
      currency: config.currency,
      company_name: data.referenceNo || "",
      guest_name: data.guestName || "",
      arrival_date: data.arrivalDate || "",
      departure_date: data.departureDate || "",
      room_number: data.roomNo || data.vd || "",
      folio_number: data.vNo || "",
      adults: data.paxAdult?.toString() || "1",
      children: data.paxChild?.toString() || "0",
      passport_no: data.passportNo || "",
      user_code: data.userId || "",
      cash_no: data.voucherNo || "",
      page_number: data.batchNo || "",
      invoice_date: data.invoiceDate || "",
      status: data.status || "pending",
      note: data.note || "",
      accommodation_details: {
        eur_amount: data.actualRate?.toString() || "0",
        exchange_rate: data.exchangeRate?.toString() || "0",
        total_nights: totalNights,
        taxable_amount: taxableAmount.toFixed(2),
        vat_10_percent: (parseFloat(data.vat1_10) || 0).toFixed(2),
        accommodation_tax: accommodationTaxPerNight.toFixed(2),
        total_per_night: (parseFloat(data.subTotal) || 0).toFixed(2),
        vat_total_nights: (parseFloat(data.vat7) || 0).toFixed(2),
        acc_tax_total_nights: totalAccommodationTax.toFixed(2)
      },
      other_services: (data.otherServices || []).map(service => ({
        id: Date.now() + Math.random(),
        service_name: service.name || "",
        service_date: service.date || "",
        gross_amount: service.amount?.toString() || "0",
        taxable_amount: service.amount ? (service.amount / 1.2).toFixed(2) : "0",
        vat_20_percent: service.amount ? ((service.amount / 1.2) * 0.2).toFixed(2) : "0",
      }))
    };
    
    setFormData(mappedFormData);
  };

  const initializeFormData = (config) => {
    const initialData = {
      hotel_name: config.hotel_name,
      currency: config.currency,
      status: "pending",
      note: ""
    };

    config.form_fields?.forEach(field => {
      initialData[field.field_id] = "";
    });

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

  const mapToTurkeyInvoiceSchema = (dynamicData, calculatedSummary) => {
    const toFixed2 = (value) => {
      const num = parseFloat(value || 0);
      return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
    };

    const capitalizeWords = (str) => {
      if (!str) return "";
      return str
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    };

    const acc = dynamicData.accommodation_details || {};
    const totalNights = parseInt(acc.total_nights) || 0;
    
    const formatDate = (dateStr) => {
      if (!dateStr) return new Date().toISOString().split("T")[0];
      return dateStr.split("T")[0];
    };

    const status = dynamicData.status || "pending";

    return {
      data: {
        referenceNo: dynamicData.company_name || `INV-${Date.now()}`,
        invoiceDate: formatDate(dynamicData.invoice_date),
        guestName: capitalizeWords(dynamicData.guest_name) || "Guest",
        hotel: dynamicData.hotel_name || "Hotel",
        vd: dynamicData.room_number || "",
        vNo: dynamicData.folio_number || "",
        roomNo: dynamicData.room_number || "",
        paxAdult: parseInt(dynamicData.adults) || 1,
        paxChild: parseInt(dynamicData.children) || 0,
        ratePlan: "",
        arrivalDate: formatDate(dynamicData.arrival_date),
        departureDate: formatDate(dynamicData.departure_date),
        nights: totalNights,
        confirmation: dynamicData.passport_no || "",
        passportNo: dynamicData.passport_no || "",
        voucherNo: dynamicData.cash_no || "",
        userId: dynamicData.user_code || "",
        batchNo: dynamicData.page_number || "",
        actualRate: toFixed2(acc.eur_amount),
        exchangeRate: toFixed2(acc.exchange_rate) || 1.0,
        sellingRate: toFixed2(acc.taxable_amount),
        newRoomRate: toFixed2(acc.taxable_amount),
        vat1_10: toFixed2(acc.vat_10_percent),
        vat7: toFixed2(acc.vat_total_nights),
        vat20: 0.0,
        vat5: 0.0,
        newVat1_10: 0.0,
        newVat7: 0.0,
        newVat20: 0.0,
        newVat5: 0.0,
        cityTaxRows: 0,
        cityTaxAmount: 0.0,
        stampTaxRows: 0,
        stampTaxAmount: 0.0,
        subTotal: toFixed2(calculatedSummary.total_amount || acc.total_per_night),
        vatTotal: toFixed2(calculatedSummary.total_vat_10 || acc.vat_total_nights),
        stampTaxTotal: 0.0,
        cityTaxTotal: 0.0,
        grandTotal: toFixed2(calculatedSummary.total_including_vat_kdv_dahil || 0),
        status: status,
        note: dynamicData.note || "",
        accommodationDetails: totalNights > 0 ? Array.from({ length: totalNights }, (_, i) => ({
          day: i + 1,
          date: formatDate(new Date(new Date(dynamicData.arrival_date).getTime() + i * 86400000).toISOString()),
          description: "Hébergement / Accommodation",
          rate: toFixed2(acc.taxable_amount || 0),
        })) : [],
        cityTaxDetails: [],
        stampTaxDetails: [],
        otherServices: (dynamicData.other_services || []).map(service => ({
          name: capitalizeWords(service.service_name) || "Service",
          date: formatDate(service.service_date),
          amount: toFixed2(service.gross_amount),
          textField1: "",
          textField2: "",
        })),
      }
    };
  };

  const calculateFinalSummary = (data) => {
    const acc = data.accommodation_details || {};
    const services = data.other_services || [];
    
    const accTotal = parseFloat(acc.total_per_night) || 0;
    const accVat = parseFloat(acc.vat_total_nights) || 0;
    const accTax = parseFloat(acc.acc_tax_total_nights) || 0;
    
    const servicesTotal = services.reduce((sum, s) => sum + (parseFloat(s.taxable_amount) || 0), 0);
    const servicesVat = services.reduce((sum, s) => sum + (parseFloat(s.vat_20_percent) || 0), 0);
    
    const totalAmount = accTotal + servicesTotal;
    const totalVat = accVat + servicesVat;
    const totalIncludingVat = totalAmount + totalVat + accTax;
    const totalInEur = totalIncludingVat / (parseFloat(acc.exchange_rate) || 1);
    
    return {
      total_amount: totalAmount,
      total_vat_10: totalVat,
      total_acc_tax: accTax,
      total_including_vat_kdv_dahil: totalIncludingVat,
      total_in_eur: totalInEur
    };
  };

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
      isEditMode ? "Updating invoice..." : "Creating invoice...",
      { position: "top-center" }
    );
    
    try {
      const calculatedSummary = calculateFinalSummary(formData);
      const invoicePayload = mapToTurkeyInvoiceSchema(formData, calculatedSummary);
      
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
        grandTotal: calculatedSummary.total_including_vat_kdv_dahil,
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
      
      toast.error(errorMessage, { duration: 6000, position: "top-center" });
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
