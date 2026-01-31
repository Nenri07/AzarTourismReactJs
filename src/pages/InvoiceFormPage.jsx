// "use client";

// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Save, Loader2 } from "lucide-react";
// import { useInvoiceCalculations } from "../hooks";
// import Decimal from "decimal.js";
// import invoiceApi from "../Api/invoice.api.js";
// import {
//   InvoiceInfoSection,
//   AccommodationSection,
//   CityTaxSection,
//   StampTaxSection,
//   OtherServicesSection,
//   InvoiceSummarySection,
// } from "../components";

// export default function InvoiceFormPage() {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const isEditMode = Boolean(id);

//   // State for API operations
//   const [isSaving, setIsSaving] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   // Use the custom hook
//   const { formData, setFormData, handleInputChange, dateError } =
//     useInvoiceCalculations({});
//   //the decimal for cal
//   Decimal.set({
//     precision: 20,
//     rounding: Decimal.ROUND_HALF_UP,
//   });

//   // Helper functions to use in your save functions
//   const D = (v) => new Decimal(v || 0);
//   const toNumber = (d) => parseFloat(d.toFixed(3)); // Convert to number with 3 decimals
//   const toStringDecimal = (d) => d.toFixed(3);

//   // Load invoice data for edit mode
//   useEffect(() => {
//     if (isEditMode && id) {
//       loadInvoiceData(id);
//     }
//   }, [isEditMode, id]);

//   const loadInvoiceData = async (invoiceId) => {
//   setIsLoading(true);
  
//   try {
//     const response = await invoiceApi.getCompleteInvoice(invoiceId);
    

//     let apiInvoice, accommodationDetails, cityTaxDetails, stampTaxDetails, otherServices;
    
//     // ✅ FIX: Handle THREE possible response structures
//     if (response.data && response.data.invoice) {
//       // Structure 1: Nested under 'data' property
//       apiInvoice = response.data.invoice;
//       accommodationDetails = response.data.accommodation_details || [];
//       cityTaxDetails = response.data.city_tax_details || [];
//       stampTaxDetails = response.data.stamp_tax_details || [];
//       otherServices = response.data.other_services || [];
//     } else if (response.invoice && response.accommodation_details !== undefined) {
//       // Structure 2: Direct properties (YOUR NEW API FORMAT)
//       apiInvoice = response.invoice;
//       accommodationDetails = response.accommodation_details || [];
//       cityTaxDetails = response.city_tax_details || [];
//       stampTaxDetails = response.stamp_tax_details || [];
//       otherServices = response.other_services || [];
//     } else if (response.id) {
//       // Structure 3: Response IS the invoice directly
//       apiInvoice = response;
//       accommodationDetails = response.accommodation_details || [];
//       cityTaxDetails = response.city_tax_details || [];
//       stampTaxDetails = response.stamp_tax_details || [];
//       otherServices = response.other_services || [];
//     } else {
//       console.error("❌ Invalid API response structure:", response);
//       throw new Error("Failed to load invoice data - invalid response structure");
//     }


//     // ✅ Map other_services with proper field mapping (already in camelCase from new API!)
//     const mappedOtherServices = (otherServices || []).map(service => ({
//       id: service.id || Date.now() + Math.random(),
//       name: service.name || "",
//       date: service.date || "",
//       amount: service.amount ? service.amount.toString() : "",
//       textField1: service.text_field1 || service.textField1 || "",
//       textField2: service.text_field2 || service.textField2 || "",
//     }));


//     // ✅ Generate stampTaxDetails if empty but stampTaxAmount exists
//     let finalStampTaxDetails = stampTaxDetails;
//     if (stampTaxDetails.length === 0 && apiInvoice.stamp_tax_amount > 0) {
//       finalStampTaxDetails = [{
//         day: 1,
//         date: apiInvoice.arrival_date || new Date().toISOString().split("T")[0],
//         description: "Timbre fiscal",
//         amount: apiInvoice.stamp_tax_amount
//       }];
     
//     }

//     setFormData({
//       id: apiInvoice.id,
//       referenceNo: apiInvoice.reference_no || "",
//       invoiceDate: apiInvoice.invoice_date || "",
//       guestName: apiInvoice.guest_name || "",
//       hotel: apiInvoice.hotel || "Novotel Tunis Lac",
//       vd: apiInvoice.vd || "",
//       vNo: apiInvoice.v_no || "",
//       roomNo: apiInvoice.room_no || "",
//       paxAdult: (apiInvoice.pax_adult || 0).toString(),
//       paxChild: (apiInvoice.pax_child || 0).toString(),
//       ratePlan: apiInvoice.rate_plan || "",
//       arrivalDate: apiInvoice.arrival_date || "",
//       departureDate: apiInvoice.departure_date || "",
//       vatNo: apiInvoice.confirmation || "",
//       cashierId: apiInvoice.passport_no || "",
//       accountNumber: apiInvoice.voucher_no || "",
//       userId: (apiInvoice.user_id || "").toString(),
//       nights: (apiInvoice.nights || 0).toString(),
//       actualRate: (apiInvoice.actual_rate || 0).toString(),
//       exchangeRate: (apiInvoice.exchange_rate || 0).toString(),
//       sellingRate: (apiInvoice.selling_rate || 0).toString(),
//       newRoomRate: (apiInvoice.new_room_rate || 0).toString(),
//       fdsct: (apiInvoice.vat1_10 || apiInvoice.vat_1_10 || 0).toString(),
//       vat7Total: (apiInvoice.vat7 || apiInvoice.vat_7 || 0).toString(),
//       vat20: "0",
//       vat5: "0",
//       newVat1_10: "0",
//       newVat7: "0",
//       newVat20: "0",
//       newVat5: "0",
//       cityTaxRows: (apiInvoice.city_tax_rows || 0).toString(),
//       cityTaxAmount: (apiInvoice.city_tax_amount || 0).toString(),
//       stampTaxRows: (apiInvoice.stamp_tax_rows || 0).toString(),
//       stampTaxAmount: (apiInvoice.stamp_tax_amount || 0).toString(),
//       netTaxable: (apiInvoice.sub_total || 0).toString(),
//       grossTotal: (apiInvoice.grand_total || 0).toString(),
//       subTotal: (apiInvoice.sub_total || 0).toString(),
//       vatTotal: (apiInvoice.vat_total || 0).toString(),
//       stampTaxTotal: (apiInvoice.stamp_tax_total || 0).toString(),
//       cityTaxTotal: (apiInvoice.city_tax_total || 0).toString(),
//       status: apiInvoice.status || "pending",
//       batchNo: apiInvoice.batch_no || "",
//       note: apiInvoice.note || "",
      
//       accommodationDetails: accommodationDetails,
//       cityTaxDetails: cityTaxDetails,
//       stampTaxDetails: finalStampTaxDetails,
      
//       // ✅ FIX: Use the properly mapped services
//       otherServices: mappedOtherServices,
//     });
    
    
//   } catch (error) {
//     console.error("❌ Error loading invoice:", error);
//     alert("Failed to load invoice. Please try again.");
//     navigate("/invoices");
//   } finally {
//     setIsLoading(false);
//   }
// };
// const handleSave = async () => {
//   if (!formData.guestName || !formData.referenceNo || !formData.status) {
//     alert("Please fill in all required fields and select the status");
//     return;
//   }

//   if (dateError) {
//     alert(dateError);
//     return;
//   }

//   // ✅ Keep your existing capitalization logic
//   const capitalizeWords = (str) => {
//     if (!str) return "";
//     return str
//       .trim()
//       .replace(/\s+/g, " ")
//       .split(" ")
//       .map(
//         (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
//       )
//       .join(" ");
//   };

//   const capitalizedGuestName = capitalizeWords(formData.guestName);
//   const capitalizedServices = (formData.otherServices || []).map(
//     (service) => ({
//       ...service,
//       name: capitalizeWords(service.name),
//     }),
//   );

//   // ✅ Keep your existing decimal helpers (without Decimal.js)
//   const toFixed3 = (value) => {
//     const num = parseFloat(value || 0);
//     return isNaN(num) ? 0 : parseFloat(num.toFixed(3));
//   };

//   const toStringDecimal = (value) => {
//     const num = parseFloat(value || 0);
//     return isNaN(num) ? "0.000" : num.toFixed(3);
//   };

//   setIsSaving(true);
  
//   try {
//     // ✅ Generate stampTaxDetails if missing
//     let finalStampTaxDetails = formData.stampTaxDetails || [];
//     if (finalStampTaxDetails.length === 0 && parseFloat(formData.stampTaxAmount) > 0) {
//       finalStampTaxDetails = [{
//         day: 1,
//         date: formData.arrivalDate || new Date().toISOString().split("T")[0],
//         description: "Timbre fiscal",
//         amount: toStringDecimal(formData.stampTaxAmount)
//       }];
//     }

//     if (isEditMode && id) {
//       // ============ UPDATE MODE ============
//       // ✅ FIX: Format data to match the API schema (camelCase format)
//       const updateData = {
//         referenceNo: formData.referenceNo,
//         invoiceDate: formData.invoiceDate || new Date().toISOString().split("T")[0],
//         guestName: capitalizedGuestName,
//         hotel: formData.hotel || "Novotel Tunis Lac",
//         vd: formData.vd || "",
//         vNo: formData.vNo || "",
//         roomNo: formData.roomNo || "",
//         paxAdult: parseInt(formData.paxAdult) || 0,
//         paxChild: parseInt(formData.paxChild) || 0,
//         ratePlan: formData.ratePlan || "",
//         arrivalDate: formData.arrivalDate || new Date().toISOString().split("T")[0],
//         departureDate: formData.departureDate || new Date().toISOString().split("T")[0],
//         confirmation: formData.vatNo || "",
//         passportNo: formData.cashierId || "",
//         voucherNo: formData.accountNumber || "",
//         userId: formData.userId || "",
//         nights: parseInt(formData.nights) || 0,
//         actualRate: toFixed3(formData.actualRate),
//         exchangeRate: toFixed3(formData.exchangeRate),
//         sellingRate: toFixed3(formData.sellingRate),
//         newRoomRate: toFixed3(formData.newRoomRate),
//         vat1_10: toFixed3(formData.fdsct),
//         vat7: toFixed3(formData.vat7Total),
//         vat20: 0,
//         vat5: 0,
//         newVat1_10: 0,
//         newVat7: 0,
//         newVat20: 0,
//         newVat5: 0,
//         cityTaxRows: parseInt(formData.cityTaxRows) || 0,
//         cityTaxAmount: toFixed3(formData.cityTaxAmount),
//         stampTaxRows: parseInt(formData.stampTaxRows) || 0,
//         stampTaxAmount: toFixed3(formData.stampTaxAmount),
//         subTotal: toFixed3(formData.netTaxable),
//         vatTotal: toFixed3(formData.vat7Total),
//         stampTaxTotal: toFixed3(formData.stampTaxTotal),
//         cityTaxTotal: toFixed3(formData.cityTaxTotal),
//         grandTotal: toFixed3(formData.grossTotal),
//         status: formData.status || "pending",
//         batchNo: formData.batchNo || "",
//         note: formData.note || "",
        
//         // ✅ Format arrays to match API schema
//         accommodationDetails: (formData.accommodationDetails || []).map(detail => ({
//           day: detail.day,
//           date: detail.date,
//           description: detail.description || "Hébergement",
//           rate: toFixed3(detail.rate || 0),
//         })),
        
//         cityTaxDetails: (formData.cityTaxDetails || []).map(detail => ({
//           day: detail.day,
//           date: detail.date,
//           description: detail.description || "Taxe de séjour",
//           amount: toFixed3(detail.amount),
//         })),
        
//         stampTaxDetails: finalStampTaxDetails.map(detail => ({
//           day: detail.day,
//           date: detail.date,
//           description: detail.description || "Timbre fiscal",
//           amount: toFixed3(detail.amount),
//         })),
        
//         // ✅ FIX: Format otherServices with capitalized names
//         otherServices: (capitalizedServices || []).map(service => ({
//           id: service.id || 0,
//           name: service.name || "",
//           date: service.date || "",
//           amount: toStringDecimal(service.amount),
//           textField1: service.textField1 || "",
//           textField2: service.textField2 || "",
//         })),
//       };


//       console.log("this is updated value of data",updateData)


//       const response = await invoiceApi.updateCompleteInvoice(id, updateData);

//       alert("Invoice updated successfully!");
//       navigate("/invoices");
      
//     } else {
//       // ============ CREATE MODE ============
//       const createData = {
//         referenceNo: formData.referenceNo,
//         invoiceDate: formData.invoiceDate || new Date().toISOString().split("T")[0],
//         guestName: capitalizedGuestName,
//         hotel: formData.hotel || "Novotel Tunis Lac",
//         vd: formData.vd || "",
//         vNo: formData.vNo || "",
//         roomNo: formData.roomNo || "",
//         paxAdult: parseInt(formData.paxAdult) || 0,
//         paxChild: parseInt(formData.paxChild) || 0,
//         ratePlan: formData.ratePlan || "",
//         arrivalDate: formData.arrivalDate || new Date().toISOString().split("T")[0],
//         departureDate: formData.departureDate || new Date().toISOString().split("T")[0],
//         confirmation: formData.vatNo || "",
//         passportNo: formData.cashierId || "",
//         voucherNo: formData.accountNumber || "",
//         userId: formData.userId || "",
//         nights: parseInt(formData.nights) || 0,
//         actualRate: toFixed3(formData.actualRate),
//         exchangeRate: toFixed3(formData.exchangeRate),
//         sellingRate: toFixed3(formData.sellingRate),
//         newRoomRate: toFixed3(formData.newRoomRate),
//         vat1_10: toFixed3(formData.fdsct),
//         vat7: toFixed3(formData.vat7Total),
//         vat20: 0,
//         vat5: 0,
//         newVat1_10: 0,
//         newVat7: 0,
//         newVat20: 0,
//         newVat5: 0,
//         cityTaxRows: parseInt(formData.cityTaxRows) || 0,
//         cityTaxAmount: toFixed3(formData.cityTaxAmount),
//         stampTaxRows: parseInt(formData.stampTaxRows) || 0,
//         stampTaxAmount: toFixed3(formData.stampTaxAmount),
//         subTotal: toFixed3(formData.netTaxable),
//         vatTotal: toFixed3(formData.vat7Total),
//         stampTaxTotal: toFixed3(formData.stampTaxTotal),
//         cityTaxTotal: toFixed3(formData.cityTaxTotal),
//         grandTotal: toFixed3(formData.grossTotal),
//         status: formData.status || "pending",
//         batchNo: formData.batchNo || "",
//         note: formData.note || "",
        
//         accommodationDetails: (formData.accommodationDetails || []).map(detail => ({
//           day: detail.day,
//           date: detail.date,
//           description: detail.description || "Hébergement",
//           rate: toFixed3(detail.rate || 0),
//         })),
        
//         cityTaxDetails: (formData.cityTaxDetails || []).map(detail => ({
//           day: detail.day,
//           date: detail.date,
//           description: detail.description || "Taxe de séjour",
//           amount: toFixed3(detail.amount),
//         })),
        
//         stampTaxDetails: finalStampTaxDetails.map(detail => ({
//           day: detail.day,
//           date: detail.date,
//           description: detail.description || "Timbre fiscal",
//           amount: toFixed3(detail.amount),
//         })),
        
//         otherServices: (capitalizedServices || []).map(service => ({
//           id: service.id || 0,
//           name: service.name || "",
//           date: service.date || "",
//           amount: toStringDecimal(service.amount),
//           textField1: service.textField1 || "",
//           textField2: service.textField2 || "",
//         })),
//       };


//       const response = await invoiceApi.createInvoice(createData);

//       alert("Invoice created successfully!");
//       navigate("/invoices");
//     }
//   } catch (error) {
//     console.error("❌ Error saving invoice:", error);
//     let errorMessage = "Failed to save invoice. ";

//     if (error.response?.data?.detail) {
//       errorMessage += error.response.data.detail;
//     } else if (error.message) {
//       errorMessage += error.message;
//     } else if (error.response?.data) {
//       errorMessage += JSON.stringify(error.response.data);
//     }

//     alert(errorMessage);
//   } finally {
//     setIsSaving(false);
//   }
// };
//   const handleCancel = () => {
//     if (
//       window.confirm(
//         "Are you sure you want to cancel? All unsaved changes will be lost.",
//       )
//     ) {
//       navigate("/invoices");
//     }
//   };

//   // Handle service input changes
//   const handleServiceChange = (id, field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       otherServices: (prev.otherServices || []).map((service) =>
//         service.id === id ? { ...service, [field]: value } : service,
//       ),
//     }));
//   };

//   // Add service
//   const addService = () => {
//     setFormData((prev) => ({
//       ...prev,
//       otherServices: [
//         ...(prev.otherServices || []),
//         {
//           id: Date.now(),
//           name: "",
//           date: "",
//           amount: "",
//           textField1: "",
//           textField2: "",
//         },
//       ],
//     }));
//   };

//   // Remove service
//   const removeService = (id) => {
//     setFormData((prev) => ({
//       ...prev,
//       otherServices: (prev.otherServices || []).filter((s) => s.id !== id),
//     }));
//   };

//   if (isLoading) {
//     return (
//       <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
//         <div className="flex flex-col items-center justify-center min-h-[400px]">
//           <Loader2 size={48} className="animate-spin text-[#003d7a] mb-4" />
//           <p className="text-slate-600 text-lg">Loading invoice data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800 pb-32 sm:pb-24">
//       <div className="mb-6 md:mb-8">
//         <h1 className="text-xl md:text-2xl font-bold text-slate-800">
//           {isEditMode ? "Edit Invoice" : "Create New Invoice"}
//         </h1>
//         <p className="text-slate-500 text-sm mt-1">
//           {isEditMode
//             ? "Update invoice details and save changes"
//             : "Fill in all required fields and save"}
//         </p>
//       </div>

//       <div className="space-y-4 md:space-y-6">
//         <InvoiceInfoSection
//           formData={formData}
//           handleInputChange={handleInputChange}
//           dateError={dateError}
//         />

//         <AccommodationSection
//           formData={formData}
//           handleInputChange={handleInputChange}
//         />

//         <CityTaxSection
//           formData={formData}
//           handleInputChange={handleInputChange}
//         />

//         <StampTaxSection
//           formData={formData}
//           handleInputChange={handleInputChange}
//         />

//         <OtherServicesSection
//           services={formData.otherServices || []}
//           onServiceChange={handleServiceChange}
//           onAddService={addService}
//           onRemoveService={removeService}
//           arrivalDate={formData.arrivalDate}
//           departureDate={formData.departureDate}
//         />

//         <InvoiceSummarySection
//           formData={formData}
//           handleInputChange={handleInputChange}
//         />
//       </div>

//       {/* Action Bar (included directly, not as a separate component) */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-4 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
//         <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end max-w-7xl mx-auto">
//           <button
//             onClick={handleCancel}
//             disabled={isSaving}
//             className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             Cancel
//           </button>

//           <button
//             onClick={handleSave}
//             disabled={isSaving}
//             className="w-full sm:w-auto bg-[#002a5c] hover:bg-[#001a3c] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {isSaving ? (
//               <>
//                 <Loader2 size={16} className="animate-spin" />
//                 {isEditMode ? "Updating..." : "Saving..."}
//               </>
//             ) : (
//               <>
//                 <Save size={16} />{" "}
//                 {isEditMode ? "Update Invoice" : "Save Invoice"}
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useInvoiceCalculations } from "../hooks";
import { useFormAutoSave } from "../hooks/useFormAutoSave";
import Decimal from "decimal.js";
import invoiceApi from "../Api/invoice.api.js";
import {
  InvoiceInfoSection,
  AccommodationSection,
  CityTaxSection,
  StampTaxSection,
  OtherServicesSection,
  InvoiceSummarySection,
} from "../components";

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  // Get session manager from App.jsx
  const { sessionManager } = useOutletContext();

  // State for API operations
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use the custom hook
  const { formData, setFormData, handleInputChange, dateError } =
    useInvoiceCalculations({});

  // Enable auto-save for this form
  const { savedFormData, clearSavedData } = useFormAutoSave(
    formData,
    isEditMode ? `invoice_edit_${id}` : 'invoice_create',
    sessionManager
  );

  // Decimal for calculations
  Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
  });

  // Helper functions
  const D = (v) => new Decimal(v || 0);
  const toNumber = (d) => parseFloat(d.toFixed(3));
  const toStringDecimal = (d) => d.toFixed(3);

  // Restore saved draft on mount (only for create mode)
  useEffect(() => {
    if (!isEditMode && savedFormData && Object.keys(savedFormData).length > 0) {
      const shouldRestore = window.confirm(
        '📄 We found an unsaved invoice draft from your previous session. Would you like to restore it?'
      );

      if (shouldRestore) {
        setFormData(savedFormData);
        console.log('✅ Draft restored');
      } else {
        clearSavedData();
        console.log('🗑️ Draft discarded');
      }
    }
  }, [savedFormData, clearSavedData, isEditMode, setFormData]);

  // Load invoice data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadInvoiceData(id);
    }
  }, [isEditMode, id]);

  const loadInvoiceData = async (invoiceId) => {
    setIsLoading(true);
    
    try {
      const response = await invoiceApi.getCompleteInvoice(invoiceId);
      
      let apiInvoice, accommodationDetails, cityTaxDetails, stampTaxDetails, otherServices;
      
      // Handle THREE possible response structures
      if (response.data && response.data.invoice) {
        apiInvoice = response.data.invoice;
        accommodationDetails = response.data.accommodation_details || [];
        cityTaxDetails = response.data.city_tax_details || [];
        stampTaxDetails = response.data.stamp_tax_details || [];
        otherServices = response.data.other_services || [];
      } else if (response.invoice && response.accommodation_details !== undefined) {
        apiInvoice = response.invoice;
        accommodationDetails = response.accommodation_details || [];
        cityTaxDetails = response.city_tax_details || [];
        stampTaxDetails = response.stamp_tax_details || [];
        otherServices = response.other_services || [];
      } else if (response.id) {
        apiInvoice = response;
        accommodationDetails = response.accommodation_details || [];
        cityTaxDetails = response.city_tax_details || [];
        stampTaxDetails = response.stamp_tax_details || [];
        otherServices = response.other_services || [];
      } else {
        console.error("❌ Invalid API response structure:", response);
        throw new Error("Failed to load invoice data - invalid response structure");
      }

      // Map other_services
      const mappedOtherServices = (otherServices || []).map(service => ({
        id: service.id || Date.now() + Math.random(),
        name: service.name || "",
        date: service.date || "",
        amount: service.amount ? service.amount.toString() : "",
        textField1: service.text_field1 || service.textField1 || "",
        textField2: service.text_field2 || service.textField2 || "",
      }));

      // Generate stampTaxDetails if empty
      let finalStampTaxDetails = stampTaxDetails;
      if (stampTaxDetails.length === 0 && apiInvoice.stamp_tax_amount > 0) {
        finalStampTaxDetails = [{
          day: 1,
          date: apiInvoice.arrival_date || new Date().toISOString().split("T")[0],
          description: "Timbre fiscal",
          amount: apiInvoice.stamp_tax_amount
        }];
      }

      setFormData({
        id: apiInvoice.id,
        referenceNo: apiInvoice.reference_no || "",
        invoiceDate: apiInvoice.invoice_date || "",
        guestName: apiInvoice.guest_name || "",
        hotel: apiInvoice.hotel || "Novotel Tunis Lac",
        vd: apiInvoice.vd || "",
        vNo: apiInvoice.v_no || "",
        roomNo: apiInvoice.room_no || "",
        paxAdult: (apiInvoice.pax_adult || 0).toString(),
        paxChild: (apiInvoice.pax_child || 0).toString(),
        ratePlan: apiInvoice.rate_plan || "",
        arrivalDate: apiInvoice.arrival_date || "",
        departureDate: apiInvoice.departure_date || "",
        vatNo: apiInvoice.confirmation || "",
        cashierId: apiInvoice.passport_no || "",
        accountNumber: apiInvoice.voucher_no || "",
        userId: (apiInvoice.user_id || "").toString(),
        nights: (apiInvoice.nights || 0).toString(),
        actualRate: (apiInvoice.actual_rate || 0).toString(),
        exchangeRate: (apiInvoice.exchange_rate || 0).toString(),
        sellingRate: (apiInvoice.selling_rate || 0).toString(),
        newRoomRate: (apiInvoice.new_room_rate || 0).toString(),
        fdsct: (apiInvoice.vat1_10 || apiInvoice.vat_1_10 || 0).toString(),
        vat7Total: (apiInvoice.vat7 || apiInvoice.vat_7 || 0).toString(),
        vat20: "0",
        vat5: "0",
        newVat1_10: "0",
        newVat7: "0",
        newVat20: "0",
        newVat5: "0",
        cityTaxRows: (apiInvoice.city_tax_rows || 0).toString(),
        cityTaxAmount: (apiInvoice.city_tax_amount || 0).toString(),
        stampTaxRows: (apiInvoice.stamp_tax_rows || 0).toString(),
        stampTaxAmount: (apiInvoice.stamp_tax_amount || 0).toString(),
        netTaxable: (apiInvoice.sub_total || 0).toString(),
        grossTotal: (apiInvoice.grand_total || 0).toString(),
        subTotal: (apiInvoice.sub_total || 0).toString(),
        vatTotal: (apiInvoice.vat_total || 0).toString(),
        stampTaxTotal: (apiInvoice.stamp_tax_total || 0).toString(),
        cityTaxTotal: (apiInvoice.city_tax_total || 0).toString(),
        status: apiInvoice.status || "pending",
        batchNo: apiInvoice.batch_no || "",
        note: apiInvoice.note || "",
        accommodationDetails: accommodationDetails,
        cityTaxDetails: cityTaxDetails,
        stampTaxDetails: finalStampTaxDetails,
        otherServices: mappedOtherServices,
      });
      
    } catch (error) {
      console.error("❌ Error loading invoice:", error);
      alert("Failed to load invoice. Please try again.");
      navigate("/invoices");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.guestName || !formData.referenceNo || !formData.status) {
      alert("Please fill in all required fields and select the status");
      return;
    }

    if (dateError) {
      alert(dateError);
      return;
    }

    const capitalizeWords = (str) => {
      if (!str) return "";
      return str
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    };

    const capitalizedGuestName = capitalizeWords(formData.guestName);
    const capitalizedServices = (formData.otherServices || []).map((service) => ({
      ...service,
      name: capitalizeWords(service.name),
    }));

    const toFixed3 = (value) => {
      const num = parseFloat(value || 0);
      return isNaN(num) ? 0 : parseFloat(num.toFixed(3));
    };

    const toStringDecimal = (value) => {
      const num = parseFloat(value || 0);
      return isNaN(num) ? "0.000" : num.toFixed(3);
    };

    setIsSaving(true);
    
    try {
      let finalStampTaxDetails = formData.stampTaxDetails || [];
      if (finalStampTaxDetails.length === 0 && parseFloat(formData.stampTaxAmount) > 0) {
        finalStampTaxDetails = [{
          day: 1,
          date: formData.arrivalDate || new Date().toISOString().split("T")[0],
          description: "Timbre fiscal",
          amount: toStringDecimal(formData.stampTaxAmount)
        }];
      }

      const invoiceData = {
        referenceNo: formData.referenceNo,
        invoiceDate: formData.invoiceDate || new Date().toISOString().split("T")[0],
        guestName: capitalizedGuestName,
        hotel: formData.hotel || "Novotel Tunis Lac",
        vd: formData.vd || "",
        vNo: formData.vNo || "",
        roomNo: formData.roomNo || "",
        paxAdult: parseInt(formData.paxAdult) || 0,
        paxChild: parseInt(formData.paxChild) || 0,
        ratePlan: formData.ratePlan || "",
        arrivalDate: formData.arrivalDate || new Date().toISOString().split("T")[0],
        departureDate: formData.departureDate || new Date().toISOString().split("T")[0],
        confirmation: formData.vatNo || "",
        passportNo: formData.cashierId || "",
        voucherNo: formData.accountNumber || "",
        userId: formData.userId || "",
        nights: parseInt(formData.nights) || 0,
        actualRate: toFixed3(formData.actualRate),
        exchangeRate: toFixed3(formData.exchangeRate),
        sellingRate: toFixed3(formData.sellingRate),
        newRoomRate: toFixed3(formData.newRoomRate),
        vat1_10: toFixed3(formData.fdsct),
        vat7: toFixed3(formData.vat7Total),
        vat20: 0,
        vat5: 0,
        newVat1_10: 0,
        newVat7: 0,
        newVat20: 0,
        newVat5: 0,
        cityTaxRows: parseInt(formData.cityTaxRows) || 0,
        cityTaxAmount: toFixed3(formData.cityTaxAmount),
        stampTaxRows: parseInt(formData.stampTaxRows) || 0,
        stampTaxAmount: toFixed3(formData.stampTaxAmount),
        subTotal: toFixed3(formData.netTaxable),
        vatTotal: toFixed3(formData.vat7Total),
        stampTaxTotal: toFixed3(formData.stampTaxTotal),
        cityTaxTotal: toFixed3(formData.cityTaxTotal),
        grandTotal: toFixed3(formData.grossTotal),
        status: formData.status || "pending",
        batchNo: formData.batchNo || "",
        note: formData.note || "",
        accommodationDetails: (formData.accommodationDetails || []).map(detail => ({
          day: detail.day,
          date: detail.date,
          description: detail.description || "Hébergement",
          rate: toFixed3(detail.rate || 0),
        })),
        cityTaxDetails: (formData.cityTaxDetails || []).map(detail => ({
          day: detail.day,
          date: detail.date,
          description: detail.description || "Taxe de séjour",
          amount: toFixed3(detail.amount),
        })),
        stampTaxDetails: finalStampTaxDetails.map(detail => ({
          day: detail.day,
          date: detail.date,
          description: detail.description || "Timbre fiscal",
          amount: toFixed3(detail.amount),
        })),
        otherServices: (capitalizedServices || []).map(service => ({
          id: service.id || 0,
          name: service.name || "",
          date: service.date || "",
          amount: toStringDecimal(service.amount),
          textField1: service.textField1 || "",
          textField2: service.textField2 || "",
        })),
      };

      if (isEditMode && id) {
        await invoiceApi.updateCompleteInvoice(id, invoiceData);
        alert("Invoice updated successfully!");
      } else {
        await invoiceApi.createInvoice(invoiceData);
        alert("Invoice created successfully!");
      }

      // Clear draft after successful save
      clearSavedData();
      sessionManager?.setUnsavedChanges(false);
      
      navigate("/invoices");
      
    } catch (error) {
      console.error("❌ Error saving invoice:", error);
      let errorMessage = "Failed to save invoice. ";

      if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else if (error.message) {
        errorMessage += error.message;
      } else if (error.response?.data) {
        errorMessage += JSON.stringify(error.response.data);
      }

      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      clearSavedData();
      sessionManager?.setUnsavedChanges(false);
      navigate("/invoices");
    }
  };

  // Handle service input changes
  const handleServiceChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      otherServices: (prev.otherServices || []).map((service) =>
        service.id === id ? { ...service, [field]: value } : service
      ),
    }));
  };

  // Add service
  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      otherServices: [
        ...(prev.otherServices || []),
        {
          id: Date.now(),
          name: "",
          date: "",
          amount: "",
          textField1: "",
          textField2: "",
        },
      ],
    }));
  };

  // Remove service
  const removeService = (id) => {
    setFormData((prev) => ({
      ...prev,
      otherServices: (prev.otherServices || []).filter((s) => s.id !== id),
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 size={48} className="animate-spin text-[#003d7a] mb-4" />
          <p className="text-slate-600 text-lg">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 font-sans text-slate-800 pb-32 sm:pb-24">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">
          {isEditMode ? "Edit Invoice" : "Create New Invoice"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isEditMode
            ? "Update invoice details and save changes"
            : "Fill in all required fields and save"}
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <InvoiceInfoSection
          formData={formData}
          handleInputChange={handleInputChange}
          dateError={dateError}
        />

        <AccommodationSection
          formData={formData}
          handleInputChange={handleInputChange}
        />

        <CityTaxSection
          formData={formData}
          handleInputChange={handleInputChange}
        />

        <StampTaxSection
          formData={formData}
          handleInputChange={handleInputChange}
        />

        <OtherServicesSection
          services={formData.otherServices || []}
          onServiceChange={handleServiceChange}
          onAddService={addService}
          onRemoveService={removeService}
          arrivalDate={formData.arrivalDate}
          departureDate={formData.departureDate}
        />

        <InvoiceSummarySection
          formData={formData}
          handleInputChange={handleInputChange}
        />
      </div>

      {/* Action Bar */}
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
            disabled={isSaving}
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
  );
}