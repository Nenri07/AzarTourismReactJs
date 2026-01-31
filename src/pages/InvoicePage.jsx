// "use client";

// import { useState, useEffect } from "react";
// import {
//   Search,
//   Download,
//   Plus,
//   Edit2,
//   Trash2,
//   CalendarIcon,
//   ChevronLeft,
//   ChevronRight,
//   FileText,
//   Eye,
//   X,
//   Loader2,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import invoiceApi from "../Api/invoice.api";

// export default function InvoicePage() {
//   const navigate = useNavigate();

//   // REAL DATA from API
//   const [invoices, setInvoices] = useState([]);

//   // DUMMY HOTELS (fallback since API might not have them)
//   const [hotels] = useState([
//     { id: 1, name: "Novotel Tunis Lac", code: "TUN", currency: "TND" },
//   ]);

//   // Loading states
//   const [loading, setLoading] = useState(true);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [deleteLoading, setDeleteLoading] = useState(null);
//   const [apiError, setApiError] = useState(null);

//   // State
//   const [selectedHotelTemplate, setSelectedHotelTemplate] = useState("");
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [selectedStartDate, setSelectedStartDate] = useState(null);
//   const [selectedEndDate, setSelectedEndDate] = useState(null);
//   const [dateSelectionMode, setDateSelectionMode] = useState("start");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("");
//   const [filterHotel, setFilterHotel] = useState("");

//   // Calendar Logic
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const daysInMonth = (date) =>
//     new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   const firstDayOfMonth = (date) =>
//     new Date(date.getFullYear(), date.getMonth(), 1).getDay();

//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [invoiceToDelete, setInvoiceToDelete] = useState(null);

//   // ==================== API INTEGRATION ====================

//   // 1. Load all data on component mount
//   useEffect(() => {
//     loadInvoices();

//     return () => {
//       invoiceApi.cancelAllRequests();
//     };
//   }, []);

//   // 2. Close calendar when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (showCalendar && !e.target.closest(".calendar-container")) {
//         setShowCalendar(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showCalendar]);


  
//   // 3. Main function to load invoices from API
//   // 3. Main function to load invoices from API
// const loadInvoices = async () => {
//   setLoading(true);
//   setApiError(null);

//   try {
//     const response = await invoiceApi.getAllRecords("load_invoices");

//     // Check if the response has the expected structure
//     if (
//       response &&
//       response.records && // Changed from response.data
//       Array.isArray(response.records) &&
//       response.records.length > 0
//     ) {
      
//       const transformedInvoices = response.records.map((item, index) => {
//         const invoice = item.invoice || {};
        
        
//         // Use hotel from API if exists, otherwise use dummy
//         const hotelFromApi = invoice.hotel;
//         const dummyHotel = hotels[0]; // Use first hotel since all are Novotel in your data

//         return {
//           id: invoice.id || index + 1,
//           invoiceNumber: invoice.reference_no || `INV-${invoice.id || index + 1}`,
//           reference: invoice.reference_no || `REF-${index + 1}`,
//           hotelId: dummyHotel.id,
//           hotelName: hotelFromApi || dummyHotel.name,
//           hotelCode: dummyHotel.code,
//           guestName: invoice.guest_name || `Guest ${index + 1}`,
//           roomNumber: invoice.room_no || `Room ${(index % 20) + 100}`,
//           arrivalDate: invoice.arrival_date || new Date(Date.now() - index * 86400000).toISOString(),
//           departureDate: invoice.departure_date || new Date(Date.now() - (index - 3) * 86400000).toISOString(),
//           nights: invoice.nights || Math.floor(Math.random() * 10) + 1,
//           grandTotal: invoice.grand_total || Math.floor(Math.random() * 5000) + 500,
//           currency: dummyHotel.currency,
//           status: invoice.status || ["ready", "pending"][index % 2],
//           pdfPath: null,
//           createdAt: invoice.created_at || new Date().toISOString(),
//           rawData: item,
//         };
//       });

//       setInvoices(transformedInvoices);
      
//     } else {
//       // If API returns no data, use DUMMY DATA
//       const dummyInvoices = generateDummyInvoices();
//       setInvoices(dummyInvoices);
//     }
//   } catch (error) {
//     console.error("❌ API Error:", error);
//     setApiError(error.message || "Failed to load invoices");

//     // On API error, use DUMMY DATA
//     const dummyInvoices = generateDummyInvoices();
//     setInvoices(dummyInvoices);
//   } finally {
//     setLoading(false);
//   }
// };  // 4. Generate dummy invoices when API fails
//   const generateDummyInvoices = () => {
//     return [
//       {
//         id: 1,
//         invoiceNumber: "TUN-2025-001",
//         reference: "TUN-2025-001",
//         hotelId: 1,
//         hotelName: "Novotel Tunis Lac",
//         hotelCode: "TUN",
//         guestName: "Mr. Muftah Zaid",
//         roomNumber: "207",
//         arrivalDate: "2025-12-22",
//         departureDate: "2025-12-29",
//         nights: 7,
//         grandTotal: 4996.9,
//         currency: "TND",
//         status: "draft",
//         pdfPath: null,
//         createdAt: "2025-12-22T10:30:00",
//       },
//       {
//         id: 2,
//         invoiceNumber: "TUN-2025-002",
//         reference: "TUN-2025-002",
//         hotelId: 1,
//         hotelName: "Novotel Tunis Lac",
//         hotelCode: "TUN",
//         guestName: "Sarah Connor",
//         roomNumber: "104",
//         arrivalDate: "2025-11-20",
//         departureDate: "2025-11-24",
//         nights: 4,
//         grandTotal: 2758.8,
//         currency: "TND",
//         status: "confirmed",
//         pdfPath: "/uploads/pdfs/TUN-2025-002.pdf",
//         createdAt: "2025-11-20T14:15:00",
//       },
//       {
//         id: 3,
//         invoiceNumber: "TUN-2025-003",
//         reference: "TUN-2025-003",
//         hotelId: 1,
//         hotelName: "Novotel Tunis Lac",
//         hotelCode: "TUN",
//         guestName: "Michael Chen",
//         roomNumber: "305",
//         arrivalDate: "2025-11-18",
//         departureDate: "2025-11-20",
//         nights: 2,
//         grandTotal: 1379.4,
//         currency: "TND",
//         status: "paid",
//         pdfPath: "/uploads/pdfs/TUN-2025-003.pdf",
//         createdAt: "2025-11-18T09:45:00",
//       },
//       {
//         id: 4,
//         invoiceNumber: "ANK-2025-001",
//         reference: "ANK-2025-001",
//         hotelId: 2,
//         hotelName: "Sheraton Ankara",
//         hotelCode: "ANK",
//         guestName: "Emma Wilson",
//         roomNumber: "512",
//         arrivalDate: "2026-01-05",
//         departureDate: "2026-01-08",
//         nights: 3,
//         grandTotal: 1850.5,
//         currency: "TRY",
//         status: "draft",
//         pdfPath: null,
//         createdAt: "2026-01-05T11:20:00",
//       },
//       {
//         id: 5,
//         invoiceNumber: "TUN-2026-004",
//         reference: "TUN-2026-004",
//         hotelId: 1,
//         hotelName: "Novotel Tunis Lac",
//         hotelCode: "TUN",
//         guestName: "Ahmed Hassan",
//         roomNumber: "201",
//         arrivalDate: "2026-01-08",
//         departureDate: "2026-01-12",
//         nights: 4,
//         grandTotal: 2758.8,
//         currency: "TND",
//         status: "confirmed",
//         pdfPath: null,
//         createdAt: "2026-01-08T16:30:00",
//       },
//     ];
//   };

//   // 5. Search invoices by name/guest/hotel
//   const handleSearch = async () => {
//     if (!searchTerm.trim()) {
//       loadInvoices(); // Reload all if search is empty
//       return;
//     }

//     setSearchLoading(true);
//     try {
//       const searchRequestId = `search_${Date.now()}`;
//       const response = await invoiceApi.searchByName(
//         searchTerm,
//         50,
//         searchRequestId,
//       );

//       if (response && response.results) {
//         // Transform search results
//         const transformedResults = response.results.map((invoice, index) => {
//           const dummyHotel = hotels[index % hotels.length];
//           return {
//             id: invoice.id || index + 1,
//             invoiceNumber:
//               invoice.reference_no || `INV-${invoice.id || index + 1}`,
//             reference: invoice.reference_no || `REF-${index + 1}`,
//             hotelId: dummyHotel.id,
//             hotelName: invoice.hotel || dummyHotel.name,
//             hotelCode: dummyHotel.code,
//             guestName: invoice.guest_name || "Guest",
//             roomNumber: invoice.room_no || "101",
//             arrivalDate: invoice.arrival_date || "2024-01-01",
//             departureDate: invoice.departure_date || "2024-01-05",
//             nights: invoice.nights || 1,
//             grandTotal: invoice.grand_total || 0,
//             currency: dummyHotel.currency,
//             status: invoice.status || "pending",
//             pdfPath: null,
//             createdAt: invoice.created_at || new Date().toISOString(),
//             rawData: invoice,
//           };
//         });

//         setInvoices(transformedResults);
//         toast.success(`Found ${transformedResults.length} results`);
//       }
//     } catch (error) {
//       console.error("Search error:", error);
//       if (
//         error !== "Request cancelled" &&
//         error.message !== "Request cancelled"
//       ) {
//         toast.error("Search failed. Using local filter instead.");
//         // Just filter locally on error - no need to set loading false here
//       }
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   // 6. Filter invoices based on search and filters (client-side filtering)
//   const filteredInvoices = invoices.filter((inv) => {
//     const matchesSearch =
//       searchTerm === "" ||
//       inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inv.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inv.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesStatus = filterStatus === "" || inv.status === filterStatus;
//     const matchesHotel =
//       filterHotel === "" || inv.hotelId === parseInt(filterHotel);

//     // Date range filtering
//     let matchesDateRange = true;
//     if (selectedStartDate || selectedEndDate) {
//       const invoiceArrival = new Date(inv.arrivalDate);
//       const invoiceDeparture = new Date(inv.departureDate);
//       invoiceArrival.setHours(0, 0, 0, 0);
//       invoiceDeparture.setHours(0, 0, 0, 0);

//       if (selectedStartDate && selectedEndDate) {
//         const start = new Date(selectedStartDate);
//         const end = new Date(selectedEndDate);
//         start.setHours(0, 0, 0, 0);
//         end.setHours(0, 0, 0, 0);
//         matchesDateRange = invoiceArrival <= end && invoiceDeparture >= start;
//       } else if (selectedStartDate) {
//         const start = new Date(selectedStartDate);
//         start.setHours(0, 0, 0, 0);
//         matchesDateRange = invoiceDeparture >= start;
//       } else if (selectedEndDate) {
//         const end = new Date(selectedEndDate);
//         end.setHours(0, 0, 0, 0);
//         matchesDateRange = invoiceArrival <= end;
//       }
//     }

//     return matchesSearch && matchesStatus && matchesHotel && matchesDateRange;
//   });

//   // 7. Create new invoice
//   const handleCreateInvoice = () => {
//     if (!selectedHotelTemplate) {
//       toast.error("Please select hotel and template");
//       return;
//     }
//     navigate("/invoice/create");
//   };

//   // 8. Open delete confirmation modal
//   const openDeleteModal = (invoice) => {
//     setInvoiceToDelete(invoice);
//     setShowDeleteModal(true);
//   };

//   // 9. Delete invoice (with dummy data fallback)
//   const handleDeleteInvoice = async () => {
//     if (!invoiceToDelete) return;

//     setDeleteLoading(invoiceToDelete.id);
//     setShowDeleteModal(false);

//     try {
//       // Try API delete first
//       await invoiceApi.deleteInvoice(
//         invoiceToDelete.id,
//         `delete_${invoiceToDelete.id}`,
//       );

//       // Update local state
//       setInvoices((prev) =>
//         prev.filter((inv) => inv.id !== invoiceToDelete.id),
//       );
//       toast.success(
//         `Invoice ${invoiceToDelete.invoiceNumber} deleted successfully!`,
//       );
//     } catch (error) {
//       console.error("Delete error:", error);

//       // If API fails, just remove from local state (for dummy data)
//       setInvoices((prev) =>
//         prev.filter((inv) => inv.id !== invoiceToDelete.id),
//       );
//       toast.success(
//         `Invoice ${invoiceToDelete.invoiceNumber} removed from view`,
//       );
//     } finally {
//       setDeleteLoading(null);
//       setInvoiceToDelete(null);
//     }
//   };

//   // 10. Download PDF
//   const handleDownloadPDF = (invoice) => {
//     if (invoice.pdfPath) {
//       toast.success(`Downloading ${invoice.invoiceNumber}...`);
//       // In real implementation, you would trigger actual download
//       // window.open(invoice.pdfPath, '_blank')
//     } else {
//       toast.error("PDF not available for this invoice yet!");
//     }
//   };

//   // 11. View invoice details
//   const handleViewInvoice = async (invoiceId) => {
//     try {
//       // Try to get from API
//       const response = await invoiceApi.getCompleteInvoice(
//         invoiceId,
//         `view_${invoiceId}`,
//       );
//       // Open in new tab
//       window.open(`/invoice/view/${invoiceId}`, "_blank");
//     } catch (error) {
//       console.error("Error loading invoice details:", error);
//       // Navigate anyway with just the ID
//       window.open(`/invoice/view/${invoiceId}`, "_blank");
//     }
//   };

//   // ==================== HELPER FUNCTIONS ====================

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const getStatusStyle = (status) => {
//     switch (status) {
//       case "ready":
//         return "bg-green-100 text-green-700 border border-green-200";
//       case "pending":
//         return "bg-amber-100 text-amber-700 border border-amber-200";
//       default:
//         return "bg-slate-100 text-slate-600 border border-slate-200";
//     }
//   };

//   const getStatusDisplay = (status) => {
//     const statusMap = {
//       ready: "Ready",
//       pedning: "Pending",
//     };
//     return statusMap[status] || status;
//   };

//   // Calendar functions
//   const handleDateClick = (day) => {
//     const newDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day,
//     );
//     newDate.setHours(0, 0, 0, 0);

//     if (dateSelectionMode === "start") {
//       setSelectedStartDate(newDate);
//       setDateSelectionMode("end");
//       if (selectedEndDate && newDate > selectedEndDate) {
//         setSelectedEndDate(null);
//       }
//     } else {
//       if (selectedStartDate && newDate < selectedStartDate) {
//         setSelectedEndDate(selectedStartDate);
//         setSelectedStartDate(newDate);
//       } else {
//         setSelectedEndDate(newDate);
//       }
//       setShowCalendar(false);
//       setDateSelectionMode("start");
//       toast.success("Date range applied");
//     }
//   };

//   const isDateInRange = (day) => {
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day,
//     );
//     date.setHours(0, 0, 0, 0);
//     if (selectedStartDate && selectedEndDate) {
//       const start = new Date(selectedStartDate);
//       const end = new Date(selectedEndDate);
//       start.setHours(0, 0, 0, 0);
//       end.setHours(0, 0, 0, 0);
//       return date >= start && date <= end;
//     }
//     return false;
//   };

//   const isStartDate = (day) => {
//     if (!selectedStartDate) return false;
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day,
//     );
//     return date.toDateString() === selectedStartDate.toDateString();
//   };

//   const isEndDate = (day) => {
//     if (!selectedEndDate) return false;
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day,
//     );
//     return date.toDateString() === selectedEndDate.toDateString();
//   };

//   const changeMonth = (offset) => {
//     setCurrentDate(
//       new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
//     );
//   };

//   const getDateDisplayText = () => {
//     if (selectedStartDate && selectedEndDate) {
//       return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
//     } else if (selectedStartDate) {
//       return `From ${formatDate(selectedStartDate)}`;
//     }
//     return "Pick a date range";
//   };

//   const handleClear = () => {
//     setSearchTerm("");
//     setFilterStatus("");
//     setFilterHotel("");
//     setSelectedStartDate(null);
//     setSelectedEndDate(null);
//     setDateSelectionMode("start");
//     loadInvoices();
//     toast.success("Filters cleared");
//   };

//   const clearDateFilter = () => {
//     setSelectedStartDate(null);
//     setSelectedEndDate(null);
//     setDateSelectionMode("start");
//   };

//   // ==================== RENDER ====================

//   if (loading) {
//     return (
//       <div className="font-sans text-slate-800 p-4 sm:p-6 bg-[#f8fafc] min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003d7a] mx-auto mb-4"></div>
//           <p className="text-slate-600">Loading invoices from server...</p>
//           <p className="text-slate-400 text-sm mt-2">
//             Will use demo data if server is unavailable
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="font-sans text-slate-800 p-3 sm:p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
//       {/* Header with API status */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
//             Invoices List
//           </h1>
//           <p className="text-slate-500 text-xs sm:text-sm mt-1">
//             Manage, track and approve hotel invoices. Total:{" "}
//             {filteredInvoices.length} invoices
//             {apiError && (
//               <span className="ml-2 text-amber-600 font-medium">
//                 (Using demo data - API Error: {apiError})
//               </span>
//             )}
//           </p>
//         </div>
//         <div className="flex gap-2 sm:gap-3">
//           <button className="btn btn-sm h-8 sm:h-10 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 gap-1 sm:gap-2 shadow-sm font-medium text-xs sm:text-sm">
//             <Download size={14} className="sm:w-4 sm:h-4" />
//             <span className="hidden xs:inline">Bulk</span> PDF
//           </button>
//         </div>
//       </div>

//       {/* CREATE INVOICE SECTION */}
//       <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
//         <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
//           <Plus size={16} className="sm:w-[18px] sm:h-[18px] text-[#22c55e]" />
//           Create New Invoice
//         </h2>
//         <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3">
//           <div className="flex-1 sm:min-w-[200px] sm:max-w-md">
//             <label className="label py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">
//               Select Hotel & Template
//             </label>
//             <select
//               className="select select-bordered w-full h-8 sm:h-10 text-xs sm:text-sm bg-white border-slate-300 focus:border-[#003d7a] focus:outline-none rounded-lg"
//               value={selectedHotelTemplate}
//               onChange={(e) => setSelectedHotelTemplate(e.target.value)}
//             >
//               <option value="">Choose hotel template...</option>
//               {hotels.map((hotel) => (
//                 <option value={`${hotel.id}-standard`}>{hotel.name} </option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={handleCreateInvoice}
//             className="btn btn-sm h-8 sm:h-10 bg-[#22c55e] hover:bg-green-600 text-white border-none font-semibold shadow-md rounded-lg gap-1 sm:gap-2 px-4 sm:px-5 text-xs sm:text-sm"
//           >
//             <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
//             Create
//           </button>
//         </div>
//       </div>

//       {/* FILTER SECTION */}
//       <div className="bg-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
//         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4 items-end">
//           {/* Hotel Filter */}
//           <div className="col-span-1 lg:col-span-2">
//             <label className="label py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">
//               Hotel
//             </label>
//             <select
//               className="select select-bordered w-full h-8 sm:h-10 text-xs sm:text-sm bg-white border-slate-300 rounded-lg"
//               value={filterHotel}
//               onChange={(e) => setFilterHotel(e.target.value)}
//             >
//               <option value="">All Hotels</option>
//               {hotels.map((hotel) => (
//                 <option key={hotel.id} value={hotel.id}>
//                   {hotel.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Status Filter */}
//           <div className="col-span-1 lg:col-span-2">
//             <label className="label py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">
//               Status
//             </label>
//             <select
//               className="select select-bordered w-full h-8 sm:h-10 text-xs sm:text-sm bg-white border-slate-300 rounded-lg"
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//             >
//               <option value="">All Status</option>
//               <option value="pending">Pending</option>
//               <option value="ready">Ready</option>
//             </select>
//           </div>

//           {/* Date Range */}
//           <div className="col-span-2 lg:col-span-2 calendar-container relative">
//             <label className="label py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">
//               Date Range
//             </label>
//             <div className="flex gap-1">
//               <button
//                 onClick={() => setShowCalendar(!showCalendar)}
//                 className="input input-bordered w-full h-8 sm:h-10 text-xs sm:text-sm bg-white border-slate-300 focus:border-[#003d7a] rounded-lg text-left flex items-center gap-1 sm:gap-2 text-slate-600 px-2 sm:px-3"
//               >
//                 <CalendarIcon size={14} className="text-slate-400 shrink-0" />
//                 <span className="truncate">{getDateDisplayText()}</span>
//               </button>
//               {(selectedStartDate || selectedEndDate) && (
//                 <button
//                   onClick={clearDateFilter}
//                   className="btn btn-ghost btn-xs sm:btn-sm btn-square h-8 sm:h-10 w-8 sm:w-10"
//                 >
//                   <X size={14} />
//                 </button>
//               )}
//             </div>

//             {/* Calendar Dropdown */}
//             {showCalendar && (
//               <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 sm:p-4 z-50 w-[280px] sm:w-72">
//                 <div className="flex items-center justify-between mb-3 sm:mb-4">
//                   <button
//                     onClick={() => changeMonth(-1)}
//                     className="p-1 hover:bg-slate-100 rounded-full"
//                   >
//                     <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
//                   </button>
//                   <span className="font-bold text-slate-700 text-xs sm:text-sm">
//                     {currentDate.toLocaleDateString("en-US", {
//                       month: "long",
//                       year: "numeric",
//                     })}
//                   </span>
//                   <button
//                     onClick={() => changeMonth(1)}
//                     className="p-1 hover:bg-slate-100 rounded-full"
//                   >
//                     <ChevronRight size={18} className="sm:w-5 sm:h-5" />
//                   </button>
//                 </div>
//                 <div className="text-[10px] sm:text-xs text-center mb-2 text-slate-500">
//                   {dateSelectionMode === "start"
//                     ? "Select start date"
//                     : "Select end date"}
//                 </div>
//                 <div className="grid grid-cols-7 gap-1 text-center mb-2">
//                   {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
//                     <span
//                       key={index}
//                       className="text-[10px] sm:text-xs font-bold text-slate-400"
//                     >
//                       {day}
//                     </span>
//                   ))}
//                 </div>
//                 <div className="grid grid-cols-7 gap-1">
//                   {Array.from({ length: firstDayOfMonth(currentDate) }).map(
//                     (_, i) => (
//                       <div key={`empty-${i}`} />
//                     ),
//                   )}
//                   {Array.from({ length: daysInMonth(currentDate) }).map(
//                     (_, i) => {
//                       const day = i + 1;
//                       const isStart = isStartDate(day);
//                       const isEnd = isEndDate(day);
//                       const inRange = isDateInRange(day);

//                       return (
//                         <button
//                           key={day}
//                           onClick={() => handleDateClick(day)}
//                           className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm rounded-full transition-colors ${
//                             isStart || isEnd
//                               ? "bg-[#003d7a] text-white font-bold"
//                               : inRange
//                                 ? "bg-[#003d7a]/20 text-[#003d7a]"
//                                 : "hover:bg-[#003d7a] hover:text-white"
//                           }`}
//                         >
//                           {day}
//                         </button>
//                       );
//                     },
//                   )}
//                 </div>
//                 {/* Quick actions */}
//                 <div className="flex gap-1 mt-3 pt-3 border-t border-slate-200">
//                   <button
//                     onClick={() => {
//                       const today = new Date();
//                       today.setHours(0, 0, 0, 0);
//                       setSelectedStartDate(today);
//                       setSelectedEndDate(today);
//                       setShowCalendar(false);
//                       toast.success("Today selected");
//                     }}
//                     className="btn btn-ghost btn-xs flex-1 text-[10px] sm:text-xs"
//                   >
//                     Today
//                   </button>
//                   <button
//                     onClick={() => {
//                       const today = new Date();
//                       const weekAgo = new Date(
//                         today.getTime() - 7 * 24 * 60 * 60 * 1000,
//                       );
//                       weekAgo.setHours(0, 0, 0, 0);
//                       today.setHours(0, 0, 0, 0);
//                       setSelectedStartDate(weekAgo);
//                       setSelectedEndDate(today);
//                       setShowCalendar(false);
//                       toast.success("Last 7 days selected");
//                     }}
//                     className="btn btn-ghost btn-xs flex-1 text-[10px] sm:text-xs"
//                   >
//                     7 days
//                   </button>
//                   <button
//                     onClick={() => {
//                       const today = new Date();
//                       const monthAgo = new Date(
//                         today.getTime() - 30 * 24 * 60 * 60 * 1000,
//                       );
//                       monthAgo.setHours(0, 0, 0, 0);
//                       today.setHours(0, 0, 0, 0);
//                       setSelectedStartDate(monthAgo);
//                       setSelectedEndDate(today);
//                       setShowCalendar(false);
//                       toast.success("Last 30 days selected");
//                     }}
//                     className="btn btn-ghost btn-xs flex-1 text-[10px] sm:text-xs"
//                   >
//                     30 days
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Search */}
//           <div className="col-span-2 lg:col-span-3">
//             <label className="label py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">
//               Search Invoice
//             </label>
//             <div className="relative">
//               <Search
//                 size={14}
//                 className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400"
//               />
//               <input
//                 type="text"
//                 placeholder="Reference, guest, hotel..."
//                 className="input input-bordered w-full pl-7 sm:pl-10 h-8 sm:h-10 bg-slate-50 text-xs sm:text-sm focus:outline-none focus:border-[#003d7a] rounded-lg"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onKeyPress={(e) => e.key === "Enter" && handleSearch()}
//               />
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="col-span-2 lg:col-span-3 flex gap-2">
//             <button
//               onClick={handleSearch}
//               disabled={searchLoading}
//               className="btn btn-sm h-8 sm:h-10 bg-[#003d7a] hover:bg-[#002a5c] text-white flex-1 border-none font-medium rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
//             >
//               {searchLoading ? (
//                 <>
//                   <Loader2 size={14} className="animate-spin" />
//                   <span className="hidden sm:inline">Searching...</span>
//                 </>
//               ) : (
//                 "Search"
//               )}
//             </button>
//             <button
//               onClick={handleClear}
//               className="btn btn-sm h-8 sm:h-10 btn-ghost bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg px-3 sm:px-6 text-xs sm:text-sm"
//             >
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* MOBILE CARD VIEW */}
//       <div className="lg:hidden space-y-3">
//         {filteredInvoices.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center text-slate-500">
//             No invoices found.{" "}
//             {searchTerm || filterStatus || filterHotel || selectedStartDate
//               ? "Try adjusting your filters."
//               : "Click 'Create' to add your first invoice."}
//           </div>
//         ) : (
//           filteredInvoices.map((inv) => (
//             <div
//               key={inv.id}
//               className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
//             >
//               <div className="flex justify-between items-start gap-2 mb-2">
//                 <div className="min-w-0 flex-1">
//                   <span className="font-bold text-[#003d7a] text-sm">
//                     {inv.invoiceNumber}
//                   </span>
//                   <p className="text-xs text-slate-400 font-medium">
//                     ID: #{inv.id}
//                   </p>
//                 </div>
//                 <span
//                   className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${getStatusStyle(inv.status)}`}
//                 >
//                   {getStatusDisplay(inv.status)}
//                 </span>
//               </div>

//               <div className="space-y-1 text-xs mb-3">
//                 <div className="flex justify-between">
//                   <span className="text-slate-500">Hotel:</span>
//                   <span className="font-medium text-slate-800 truncate ml-2">
//                     {inv.hotelName}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-slate-500">Guest:</span>
//                   <span className="font-medium text-slate-800 truncate ml-2">
//                     {inv.guestName}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-slate-500">Room:</span>
//                   <span className="font-medium text-slate-800">
//                     {inv.roomNumber}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-slate-500">Dates:</span>
//                   <span className="font-medium text-slate-800">
//                     {formatDate(inv.arrivalDate)} -{" "}
//                     {formatDate(inv.departureDate)}
//                   </span>
//                 </div>
//               </div>

//               <div className="flex justify-between items-center pt-2 border-t border-slate-100">
//                 <span className="font-bold text-slate-800">
//                   {inv.grandTotal.toFixed(2)} {inv.currency}
//                 </span>
//                 <div className="flex items-center gap-0.5">
//                   <button
//                     onClick={() => handleDownloadPDF(inv)}
//                     className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-[#003d7a] hover:bg-blue-50"
//                     title="Download PDF"
//                   >
//                     <FileText size={14} />
//                   </button>
//                   <button
//                     onClick={() => handleViewInvoice(inv.id)}
//                     className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-green-600 hover:bg-green-50"
//                     title="View Details"
//                   >
//                     <Eye size={14} />
//                   </button>
//                   <button
//                     onClick={() => navigate(`/invoice/edit/${inv.id}`)}
//                     className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-[#f39c12] hover:bg-amber-50"
//                     title="Edit"
//                   >
//                     <Edit2 size={14} />
//                   </button>
//                   <button
//                     onClick={() => openDeleteModal(inv)}
//                     disabled={deleteLoading === inv.id}
//                     className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
//                     title="Delete"
//                   >
//                     {deleteLoading === inv.id ? (
//                       <Loader2 size={12} className="animate-spin" />
//                     ) : (
//                       <Trash2 size={14} />
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* DESKTOP TABLE VIEW */}
//       <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//         {filteredInvoices.length === 0 ? (
//           <div className="p-8 text-center text-slate-500">
//             No invoices found.{" "}
//             {searchTerm || filterStatus || filterHotel || selectedStartDate
//               ? "Try adjusting your filters."
//               : "Click 'Create' to add your first invoice."}
//           </div>
//         ) : (
//           <table className="table w-full">
//             <thead className="bg-[#f8fafc] border-b border-slate-100">
//               <tr>
//                 <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
//                   Invoice Details
//                 </th>
//                 <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
//                   Hotel / Guest
//                 </th>
//                 <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
//                   Dates
//                 </th>
//                 <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
//                   Amount
//                 </th>
//                 <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {filteredInvoices.map((inv) => (
//                 <tr
//                   key={inv.id}
//                   className="hover:bg-blue-50/30 transition-colors group bg-white"
//                 >
//                   <td className="px-6 py-5 align-top">
//                     <div className="flex flex-col gap-1">
//                       <span className="font-bold text-[#003d7a] text-sm">
//                         {inv.invoiceNumber}
//                       </span>
//                       <span className="text-xs text-slate-400 font-medium">
//                         ID: #{inv.id}
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-5 align-top">
//                     <div className="flex flex-col gap-0.5">
//                       <span className="font-bold text-slate-800 text-sm">
//                         {inv.hotelName}
//                       </span>
//                       <span className="text-xs text-slate-500">
//                         Guest: {inv.guestName}
//                       </span>
//                       <span className="text-xs text-slate-400">
//                         Room: {inv.roomNumber}
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-5 align-top">
//                     <div className="flex flex-col gap-1">
//                       <span className="text-xs text-slate-600">
//                         <span className="font-semibold text-slate-400 uppercase mr-1">
//                           Arrival:
//                         </span>
//                         {formatDate(inv.arrivalDate)}
//                       </span>
//                       <span className="text-xs text-slate-600">
//                         <span className="font-semibold text-slate-400 uppercase mr-1">
//                           Departure:
//                         </span>
//                         {formatDate(inv.departureDate)}
//                       </span>
//                       <span className="text-xs text-slate-400">
//                         {inv.nights} nights
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-5 align-top">
//                     <div className="flex flex-col">
//                       <span className="font-bold text-slate-800">
//                         {inv.grandTotal.toFixed(2)} {inv.currency}
//                       </span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-5 align-top">
//                     <span
//                       className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(inv.status)}`}
//                     >
//                       {getStatusDisplay(inv.status)}
//                     </span>
//                   </td>
//                   <td className="px-6 py-5 align-top text-right">
//                     <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
//                       <button
//                         onClick={() => handleDownloadPDF(inv)}
//                         className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-[#003d7a] hover:bg-blue-50 transition-colors"
//                         title="Download PDF"
//                       >
//                         <FileText size={16} />
//                       </button>
//                       <button
//                         onClick={() => handleViewInvoice(inv.id)}
//                         className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
//                         title="View Details"
//                       >
//                         <Eye size={16} />
//                       </button>
//                       <button
//                         onClick={() => navigate(`/invoice/edit/${inv.id}`)}
//                         className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-[#f39c12] hover:bg-amber-50 transition-colors"
//                         title="Edit"
//                       >
//                         <Edit2 size={16} />
//                       </button>
//                       <button
//                         onClick={() => openDeleteModal(inv)}
//                         disabled={deleteLoading === inv.id}
//                         className="btn btn-xs btn-ghost btn-square text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center"
//                         title="Delete"
//                       >
//                         {deleteLoading === inv.id ? (
//                           <Loader2 size={14} className="animate-spin" />
//                         ) : (
//                           <Trash2 size={16} />
//                         )}
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Summary Footer */}
//       <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs sm:text-sm text-slate-500 px-1 sm:px-2">
//         <div>
//           Showing {filteredInvoices.length} of {invoices.length} total invoices
//           {apiError && <span className="ml-2 text-amber-600">(Demo Mode)</span>}
//         </div>
//         <div className="flex flex-wrap gap-2 sm:gap-4">
//           <span>
//             Pending: {invoices.filter((i) => i.status === "pending").length}
//           </span>
//           <span>
//             Ready: {invoices.filter((i) => i.status === "ready").length}
//           </span>
//         </div>
//       </div>

//       {/* Delete Confirmation Modal */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-4 sm:p-6">
//             <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2">
//               Delete Invoice
//             </h3>
//             <p className="text-sm text-slate-600 mb-4 sm:mb-6">
//               Are you sure you want to delete invoice{" "}
//               <strong>{invoiceToDelete?.invoiceNumber}</strong>? This action
//               cannot be undone.
//             </p>
//             <div className="flex justify-end gap-2 sm:gap-3">
//               <button
//                 className="btn btn-sm h-8 sm:h-10 btn-ghost text-slate-600 font-medium text-xs sm:text-sm"
//                 onClick={() => setShowDeleteModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn btn-sm h-8 sm:h-10 bg-red-500 hover:bg-red-600 text-white border-none font-medium text-xs sm:text-sm"
//                 onClick={handleDeleteInvoice}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";

// import { useState, useEffect } from "react";
// import {
//   Search,
//   Download,
//   Plus,
//   Edit2,
//   Trash2,
//   CalendarIcon,
//   ChevronLeft,
//   ChevronRight,
//   FileText,
//   Eye,
//   X,
//   Loader2,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";
// import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
// import { getHotelConfigs } from "../Api/hotelConfig.api";

// export default function InvoicePage() {
//   const navigate = useNavigate();

//   const [hotels, setHotels] = useState([]);
//   const [loadingHotels, setLoadingHotels] = useState(true);
//   const [invoices, setInvoices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [deleteLoading, setDeleteLoading] = useState(null);
//   const [selectedHotelTemplate, setSelectedHotelTemplate] = useState("");
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [selectedStartDate, setSelectedStartDate] = useState(null);
//   const [selectedEndDate, setSelectedEndDate] = useState(null);
//   const [dateSelectionMode, setDateSelectionMode] = useState("start");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("");
//   const [filterHotel, setFilterHotel] = useState("");
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [invoiceToDelete, setInvoiceToDelete] = useState(null);

//   const daysInMonth = (date) =>
//     new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
//   const firstDayOfMonth = (date) =>
//     new Date(date.getFullYear(), date.getMonth(), 1).getDay();

//   useEffect(() => {
//     loadHotels();
//     loadInvoices();
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (showCalendar && !e.target.closest(".calendar-container")) {
//         setShowCalendar(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showCalendar]);

//   const loadHotels = async () => {
//     setLoadingHotels(true);
//     try {
//       const response = await getHotelConfigs();
//       const hotelsList = (response.data || response || []).map(config => ({
//         id: config.id,
//         name: config.hotel_name,
//         code: config.currency || "TRY",
//         currency: config.currency || "TRY"
//       }));
//       setHotels(hotelsList);
//     } catch (error) {
//       console.error("❌ Error loading hotels:", error);
//       toast.error("Failed to load hotel configurations");
//       setHotels([]);
//     } finally {
//       setLoadingHotels(false);
//     }
//   };

//   const loadInvoices = async () => {
//     setLoading(true);
//     try {
//       const response = await turkeyInvoiceApi.getAllInvoices();
//       const invoicesList = response.data || response || [];
      
//       const transformedInvoices = invoicesList.map((invoice) => {
//         let data = invoice.data || invoice;
        
//         if (data.data && typeof data.data === 'object') {
//           data = data.data;
//         }
        
//         return {
//           id: invoice.id,
//           invoiceNumber: data.referenceNo || `INV-${invoice.id?.substring(0, 8)}`,
//           reference: data.referenceNo || `REF-${invoice.id?.substring(0, 8)}`,
//           hotelName: data.hotel || "Unknown Hotel",
//           guestName: data.guestName || "Guest",
//           roomNumber: data.roomNo || data.vd || "N/A",
//           arrivalDate: data.arrivalDate || new Date().toISOString(),
//           departureDate: data.departureDate || new Date().toISOString(),
//           nights: data.nights || 0,
//           grandTotal: parseFloat(data.grandTotal) || 0,
//           currency: "TRY",
//           status: data.status || "pending",
//           pdfPath: null,
//           createdAt: invoice.created_at || new Date().toISOString(),
//           rawData: invoice,
//         };
//       });

//       setInvoices(transformedInvoices);
//       toast.success(`Loaded ${transformedInvoices.length} invoices`, {
//         duration: 2000
//       });
//     } catch (error) {
//       console.error("❌ Error loading Turkey invoices:", error);
//       toast.error("Failed to load invoices");
//       setInvoices([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateInvoice = () => {
//     if (!selectedHotelTemplate) {
//       toast.error("Please select a hotel", { duration: 2000 });
//       return;
//     }
    
//     navigate(`/invoice/create/${selectedHotelTemplate}`);
//   };

//   const handleViewInvoice = (invoiceId) => {
//     const invoice = invoices.find(inv => inv.id === invoiceId);
//     if (!invoice) {
//       toast.error("Invoice not found");
//       return;
//     }
    
//     navigate(`/invoice/view/${invoiceId}`);
//   };

//   const handleEditInvoice = (invoice) => {
//     navigate(`/invoices/edit/${invoice.id}`);
//   };

//   const openDeleteModal = (invoice) => {
//     setInvoiceToDelete(invoice);
//     setShowDeleteModal(true);
//   };

//   const handleDeleteInvoice = async () => {
//     if (!invoiceToDelete) return;

//     setDeleteLoading(invoiceToDelete.id);
//     setShowDeleteModal(false);

//     try {
//       await turkeyInvoiceApi.deleteInvoice(invoiceToDelete.id);
//       setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
//       toast.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully!`, {
//         duration: 3000,
//         icon: "🗑️"
//       });
//     } catch (error) {
//       console.error("❌ Delete error:", error);
//       toast.error("Failed to delete invoice");
//     } finally {
//       setDeleteLoading(null);
//       setInvoiceToDelete(null);
//     }
//   };

//   const handleDownloadPDF = (invoice) => {
//     if (invoice.pdfPath) {
//       toast.success(`Downloading ${invoice.invoiceNumber}...`);
//     } else {
//       toast.error("PDF not available for this invoice yet!");
//     }
//   };

//   const handleSearch = () => {
//     if (!searchTerm.trim()) {
//       loadInvoices();
//       return;
//     }
//     setSearchLoading(true);
//     setTimeout(() => setSearchLoading(false), 500);
//   };

//   const filteredInvoices = invoices.filter((inv) => {
//     const matchesSearch =
//       searchTerm === "" ||
//       inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inv.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       inv.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesStatus = filterStatus === "" || inv.status === filterStatus;
//     const matchesHotel = filterHotel === "" || inv.hotelName === filterHotel;

//     let matchesDateRange = true;
//     if (selectedStartDate || selectedEndDate) {
//       const invoiceArrival = new Date(inv.arrivalDate);
//       const invoiceDeparture = new Date(inv.departureDate);
//       invoiceArrival.setHours(0, 0, 0, 0);
//       invoiceDeparture.setHours(0, 0, 0, 0);

//       if (selectedStartDate && selectedEndDate) {
//         const start = new Date(selectedStartDate);
//         const end = new Date(selectedEndDate);
//         start.setHours(0, 0, 0, 0);
//         end.setHours(0, 0, 0, 0);
//         matchesDateRange = invoiceArrival <= end && invoiceDeparture >= start;
//       } else if (selectedStartDate) {
//         const start = new Date(selectedStartDate);
//         start.setHours(0, 0, 0, 0);
//         matchesDateRange = invoiceDeparture >= start;
//       } else if (selectedEndDate) {
//         const end = new Date(selectedEndDate);
//         end.setHours(0, 0, 0, 0);
//         matchesDateRange = invoiceArrival <= end;
//       }
//     }

//     return matchesSearch && matchesStatus && matchesHotel && matchesDateRange;
//   });

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const getStatusStyle = (status) => {
//     switch (status?.toLowerCase()) {
//       case "ready":
//         return "bg-green-100 text-green-700 border border-green-200";
//       case "pending":
//         return "bg-amber-100 text-amber-700 border border-amber-200";
//       default:
//         return "bg-slate-100 text-slate-600 border border-slate-200";
//     }
//   };

//   const getStatusDisplay = (status) => {
//     const statusMap = {
//       ready: "Ready",
//       pending: "Pending",
//     };
//     return statusMap[status?.toLowerCase()] || status;
//   };

//   const handleDateClick = (day) => {
//     const newDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day
//     );
//     newDate.setHours(0, 0, 0, 0);

//     if (dateSelectionMode === "start") {
//       setSelectedStartDate(newDate);
//       setDateSelectionMode("end");
//       if (selectedEndDate && newDate > selectedEndDate) {
//         setSelectedEndDate(null);
//       }
//     } else {
//       if (selectedStartDate && newDate < selectedStartDate) {
//         setSelectedEndDate(selectedStartDate);
//         setSelectedStartDate(newDate);
//       } else {
//         setSelectedEndDate(newDate);
//       }
//       setShowCalendar(false);
//       setDateSelectionMode("start");
//       toast.success("Date range applied");
//     }
//   };

//   const isDateInRange = (day) => {
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day
//     );
//     date.setHours(0, 0, 0, 0);
//     if (selectedStartDate && selectedEndDate) {
//       const start = new Date(selectedStartDate);
//       const end = new Date(selectedEndDate);
//       start.setHours(0, 0, 0, 0);
//       end.setHours(0, 0, 0, 0);
//       return date >= start && date <= end;
//     }
//     return false;
//   };

//   const isStartDate = (day) => {
//     if (!selectedStartDate) return false;
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day
//     );
//     return date.toDateString() === selectedStartDate.toDateString();
//   };

//   const isEndDate = (day) => {
//     if (!selectedEndDate) return false;
//     const date = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       day
//     );
//     return date.toDateString() === selectedEndDate.toDateString();
//   };

//   const changeMonth = (offset) => {
//     setCurrentDate(
//       new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
//     );
//   };

//   const getDateDisplayText = () => {
//     if (selectedStartDate && selectedEndDate) {
//       return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
//     } else if (selectedStartDate) {
//       return `From ${formatDate(selectedStartDate)}`;
//     }
//     return "Pick a date range";
//   };

//   const handleClear = () => {
//     setSearchTerm("");
//     setFilterStatus("");
//     setFilterHotel("");
//     setSelectedStartDate(null);
//     setSelectedEndDate(null);
//     setDateSelectionMode("start");
//     loadInvoices();
//     toast.success("Filters cleared");
//   };

//   const clearDateFilter = () => {
//     setSelectedStartDate(null);
//     setSelectedEndDate(null);
//     setDateSelectionMode("start");
//   };

//   if (loading || loadingHotels) {
//     return (
//       <div className="font-sans text-slate-800 p-4 sm:p-6 bg-[#f8fafc] min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003d7a] mx-auto mb-4"></div>
//           <p className="text-slate-600">Loading invoices...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="font-sans text-slate-800 p-3 sm:p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
//             Invoices List
//           </h1>
//           <p className="text-slate-500 text-xs sm:text-sm mt-1">
//             Manage and track hotel invoices • {filteredInvoices.length} total
//           </p>
//         </div>
//         <div className="flex gap-2 sm:gap-3">
//           <button className="btn btn-sm h-9 sm:h-10 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 gap-1 sm:gap-2 shadow-sm font-medium text-xs sm:text-sm px-3 sm:px-4">
//             <Download size={14} className="sm:w-4 sm:h-4" />
//             <span className="hidden sm:inline">Bulk</span> PDF
//           </button>
//         </div>
//       </div>

//       <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
//         <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
//           <Plus size={16} className="text-[#22c55e]" />
//           Create New Invoice
//         </h2>
//         <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
//           <div className="flex-1 sm:max-w-sm">
//             <label className="label pb-1 text-xs font-semibold text-slate-600">
//               Select Hotel
//             </label>
//             <select
//               className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] focus:outline-none rounded-lg"
//               value={selectedHotelTemplate}
//               onChange={(e) => setSelectedHotelTemplate(e.target.value)}
//               disabled={loadingHotels}
//             >
//               <option value="">
//                 {loadingHotels ? "Loading..." : "Choose hotel..."}
//               </option>
//               {hotels.map((hotel) => (
//                 <option key={hotel.id} value={hotel.id}>
//                   {hotel.name} ({hotel.currency})
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={handleCreateInvoice}
//             disabled={!selectedHotelTemplate || loadingHotels}
//             className="btn btn-sm h-10 bg-[#22c55e] hover:bg-green-600 text-white border-none font-semibold shadow-md rounded-lg gap-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <Plus size={16} />
//             Create Invoice
//           </button>
//         </div>
//       </div>

//       <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
//           <div className="sm:col-span-1 lg:col-span-2">
//             <label className="label pb-1 text-xs font-semibold text-slate-600">
//               Hotel
//             </label>
//             <select
//               className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg"
//               value={filterHotel}
//               onChange={(e) => setFilterHotel(e.target.value)}
//             >
//               <option value="">All Hotels</option>
//               {[...new Set(invoices.map(inv => inv.hotelName))].map((hotelName, idx) => (
//                 <option key={idx} value={hotelName}>
//                   {hotelName}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="sm:col-span-1 lg:col-span-2">
//             <label className="label pb-1 text-xs font-semibold text-slate-600">
//               Status
//             </label>
//             <select
//               className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg"
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//             >
//               <option value="">All Status</option>
//               <option value="pending">Pending</option>
//               <option value="ready">Ready</option>
//             </select>
//           </div>

//           <div className="sm:col-span-2 lg:col-span-3 calendar-container relative">
//             <label className="label pb-1 text-xs font-semibold text-slate-600">
//               Date Range
//             </label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setShowCalendar(!showCalendar)}
//                 className="input input-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] rounded-lg text-left flex items-center gap-2 text-slate-600 px-3"
//               >
//                 <CalendarIcon size={14} className="text-slate-400 shrink-0" />
//                 <span className="truncate text-xs">{getDateDisplayText()}</span>
//               </button>
//               {(selectedStartDate || selectedEndDate) && (
//                 <button
//                   onClick={clearDateFilter}
//                   className="btn btn-ghost btn-sm h-10 w-10 min-h-0 p-0"
//                 >
//                   <X size={16} />
//                 </button>
//               )}
//             </div>

//             {showCalendar && (
//               <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-[300px]">
//                 <div className="flex items-center justify-between mb-4">
//                   <button
//                     onClick={() => changeMonth(-1)}
//                     className="p-1 hover:bg-slate-100 rounded-full"
//                   >
//                     <ChevronLeft size={20} />
//                   </button>
//                   <span className="font-bold text-slate-700 text-sm">
//                     {currentDate.toLocaleDateString("en-US", {
//                       month: "long",
//                       year: "numeric",
//                     })}
//                   </span>
//                   <button
//                     onClick={() => changeMonth(1)}
//                     className="p-1 hover:bg-slate-100 rounded-full"
//                   >
//                     <ChevronRight size={20} />
//                   </button>
//                 </div>
//                 <div className="text-xs text-center mb-2 text-slate-500">
//                   {dateSelectionMode === "start"
//                     ? "Select start date"
//                     : "Select end date"}
//                 </div>
//                 <div className="grid grid-cols-7 gap-1 text-center mb-2">
//                   {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
//                     <span
//                       key={index}
//                       className="text-xs font-bold text-slate-400"
//                     >
//                       {day}
//                     </span>
//                   ))}
//                 </div>
//                 <div className="grid grid-cols-7 gap-1">
//                   {Array.from({ length: firstDayOfMonth(currentDate) }).map(
//                     (_, i) => (
//                       <div key={`empty-${i}`} />
//                     )
//                   )}
//                   {Array.from({ length: daysInMonth(currentDate) }).map(
//                     (_, i) => {
//                       const day = i + 1;
//                       const isStart = isStartDate(day);
//                       const isEnd = isEndDate(day);
//                       const inRange = isDateInRange(day);

//                       return (
//                         <button
//                           key={day}
//                           onClick={() => handleDateClick(day)}
//                           className={`w-9 h-9 flex items-center justify-center text-sm rounded-full transition-colors ${
//                             isStart || isEnd
//                               ? "bg-[#003d7a] text-white font-bold"
//                               : inRange
//                                 ? "bg-[#003d7a]/20 text-[#003d7a]"
//                                 : "hover:bg-[#003d7a] hover:text-white"
//                           }`}
//                         >
//                           {day}
//                         </button>
//                       );
//                     }
//                   )}
//                 </div>
//                 <div className="flex gap-1 mt-3 pt-3 border-t border-slate-200">
//                   <button
//                     onClick={() => {
//                       const today = new Date();
//                       today.setHours(0, 0, 0, 0);
//                       setSelectedStartDate(today);
//                       setSelectedEndDate(today);
//                       setShowCalendar(false);
//                       toast.success("Today selected");
//                     }}
//                     className="btn btn-ghost btn-xs flex-1 text-xs"
//                   >
//                     Today
//                   </button>
//                   <button
//                     onClick={() => {
//                       const today = new Date();
//                       const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
//                       weekAgo.setHours(0, 0, 0, 0);
//                       today.setHours(0, 0, 0, 0);
//                       setSelectedStartDate(weekAgo);
//                       setSelectedEndDate(today);
//                       setShowCalendar(false);
//                       toast.success("Last 7 days selected");
//                     }}
//                     className="btn btn-ghost btn-xs flex-1 text-xs"
//                   >
//                     7 days
//                   </button>
//                   <button
//                     onClick={() => {
//                       const today = new Date();
//                       const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
//                       monthAgo.setHours(0, 0, 0, 0);
//                       today.setHours(0, 0, 0, 0);
//                       setSelectedStartDate(monthAgo);
//                       setSelectedEndDate(today);
//                       setShowCalendar(false);
//                       toast.success("Last 30 days selected");
//                     }}
//                     className="btn btn-ghost btn-xs flex-1 text-xs"
//                   >
//                     30 days
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="sm:col-span-2 lg:col-span-3">
//             <label className="label pb-1 text-xs font-semibold text-slate-600">
//               Search
//             </label>
//             <div className="relative">
//               <Search
//                 size={14}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//               />
//               <input
//                 type="text"
//                 placeholder="Reference, guest, hotel..."
//                 className="input input-bordered w-full pl-10 h-10 bg-slate-50 text-sm focus:outline-none focus:border-[#003d7a] rounded-lg"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 onKeyPress={(e) => e.key === "Enter" && handleSearch()}
//               />
//             </div>
//           </div>

//           <div className="sm:col-span-2 lg:col-span-2 flex gap-2">
//             <button
//               onClick={handleSearch}
//               disabled={searchLoading}
//               className="btn btn-sm h-10 bg-[#003d7a] hover:bg-[#002a5c] text-white flex-1 border-none font-medium rounded-lg shadow-sm disabled:opacity-50 text-sm"
//             >
//               {searchLoading ? (
//                 <>
//                   <Loader2 size={14} className="animate-spin mr-1" />
//                   Searching...
//                 </>
//               ) : (
//                 "Search"
//               )}
//             </button>
//             <button
//               onClick={handleClear}
//               className="btn btn-sm h-10 btn-ghost bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg px-4 text-sm"
//             >
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       {filteredInvoices.length === 0 ? (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
//           <FileText size={64} className="mx-auto mb-4 text-slate-200" />
//           <h3 className="text-lg font-semibold text-slate-700 mb-2">No invoices found</h3>
//           <p className="text-sm text-slate-500">
//             {searchTerm || filterStatus || filterHotel || selectedStartDate
//               ? "Try adjusting your filters"
//               : "Create your first invoice to get started"}
//           </p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="table w-full">
//               <thead className="bg-[#f8fafc] border-b-2 border-slate-200">
//                 <tr>
//                   <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">
//                     Invoice Details
//                   </th>
//                   <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">
//                     Hotel / Guest
//                   </th>
//                   <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">
//                     Dates
//                   </th>
//                   <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
//                     Amount
//                   </th>
//                   <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
//                     Status
//                   </th>
//                   <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {filteredInvoices.map((inv) => (
//                   <tr
//                     key={inv.id}
//                     className="hover:bg-blue-50/30 transition-colors group bg-white"
//                   >
//                     <td className="px-4 py-3">
//                       <div className="flex flex-col gap-0.5">
//                         <span className="font-bold text-[#003d7a] text-sm">
//                           {inv.invoiceNumber}
//                         </span>
//                         <span className="text-[10px] text-slate-400 font-mono">
//                           {inv.id.substring(0, 8)}...
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="flex flex-col gap-0.5 max-w-[200px]">
//                         <span className="font-bold text-slate-800 text-sm truncate">
//                           {inv.hotelName}
//                         </span>
//                         <span className="text-xs text-slate-500 truncate">
//                           {inv.guestName}
//                         </span>
//                         <span className="text-xs text-slate-400">
//                           Room: {inv.roomNumber}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="flex flex-col gap-0.5 text-xs">
//                         <span className="text-slate-700">
//                           {formatDate(inv.arrivalDate)}
//                         </span>
//                         <span className="text-slate-700">
//                           {formatDate(inv.departureDate)}
//                         </span>
//                         <span className="text-[10px] text-slate-400">
//                           {inv.nights} nights
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <div className="flex flex-col items-end">
//                         <span className="font-bold text-slate-800">
//                           {inv.grandTotal.toFixed(2)}
//                         </span>
//                         <span className="text-xs text-slate-500">
//                           {inv.currency}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-center">
//                       <span
//                         className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(inv.status)}`}
//                       >
//                         {getStatusDisplay(inv.status)}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
//                         <button
//                           onClick={() => handleDownloadPDF(inv)}
//                           className="p-1.5 text-slate-400 hover:text-[#003d7a] hover:bg-blue-50 rounded transition-colors"
//                           title="Download PDF"
//                         >
//                           <FileText size={16} />
//                         </button>
//                         <button
//                           onClick={() => handleViewInvoice(inv.id)}
//                           className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
//                           title="View"
//                         >
//                           <Eye size={16} />
//                         </button>
//                         <button
//                           onClick={() => handleEditInvoice(inv)}
//                           className="p-1.5 text-slate-400 hover:text-[#f39c12] hover:bg-amber-50 rounded transition-colors"
//                           title="Edit"
//                         >
//                           <Edit2 size={16} />
//                         </button>
//                         <button
//                           onClick={() => openDeleteModal(inv)}
//                           disabled={deleteLoading === inv.id}
//                           className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
//                           title="Delete"
//                         >
//                           {deleteLoading === inv.id ? (
//                             <Loader2 size={14} className="animate-spin" />
//                           ) : (
//                             <Trash2 size={16} />
//                           )}
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 px-2">
//         <div>
//           Showing {filteredInvoices.length} of {invoices.length} invoices
//         </div>
//         <div className="flex gap-4">
//           <span>Pending: {invoices.filter((i) => i.status === "pending").length}</span>
//           <span>Ready: {invoices.filter((i) => i.status === "ready").length}</span>
//         </div>
//       </div>

//       {showDeleteModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
//             <h3 className="font-bold text-lg text-slate-900 mb-2">
//               Delete Invoice
//             </h3>
//             <p className="text-sm text-slate-600 mb-6">
//               Are you sure you want to delete invoice{" "}
//               <strong>{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 className="btn btn-sm h-10 btn-ghost text-slate-600 font-medium"
//                 onClick={() => setShowDeleteModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="btn btn-sm h-10 bg-red-500 hover:bg-red-600 text-white border-none font-medium"
//                 onClick={handleDeleteInvoice}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
import { getHotelConfigs } from "../Api/hotelConfig.api";

export default function InvoicePage() {
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [selectedHotelTemplate, setSelectedHotelTemplate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [dateSelectionMode, setDateSelectionMode] = useState("start");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterHotel, setFilterHotel] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  useEffect(() => {
    loadHotels();
    loadInvoices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCalendar && !e.target.closest(".calendar-container")) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  const loadHotels = async () => {
    setLoadingHotels(true);
    try {
      const response = await getHotelConfigs();
      console.log("📥 Hotels API Response:", response);
      
      // Handle the response structure
      let hotelsList = [];
      if (response && response.data && Array.isArray(response.data)) {
        hotelsList = response.data;
      } else if (Array.isArray(response)) {
        hotelsList = response;
      }
      
      const transformedHotels = hotelsList.map(config => ({
        id: config.id,
        name: config.hotel_name,
        code: config.currency || "TRY",
        currency: config.currency || "TRY"
      }));
      
      setHotels(transformedHotels);
    } catch (error) {
      console.error("❌ Error loading hotels:", error);
      toast.error("Failed to load hotel configurations");
      setHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await turkeyInvoiceApi.getAllInvoices();
      console.log("📥 Raw Turkey Invoice API Response:", response);
      
      // Check if we got HTML instead of JSON (API endpoint issue)
      if (typeof response === 'string' && response.includes('<!doctype html>')) {
        console.error("❌ API returned HTML instead of JSON - check API endpoint URL");
        toast.error("API endpoint error - Please check backend configuration");
        setInvoices([]);
        setLoading(false);
        return;
      }
      
      // Handle the response structure from turkeyInvoiceApi
      // Expected structure: { data: [...], count: number } or just [...]
      let invoicesList = [];
      
      if (response && response.data && Array.isArray(response.data)) {
        // Structure: { data: [...], count: X }
        invoicesList = response.data;
        console.log(`📊 Found ${response.count || invoicesList.length} invoices in response`);
      } else if (Array.isArray(response)) {
        // Direct array response
        invoicesList = response;
      } else if (response && typeof response === 'object') {
        // Fallback: try to find array in response
        console.warn("⚠️ Unexpected response structure:", response);
        invoicesList = [];
      }
      
      console.log("📋 Processing Invoices List:", invoicesList);
      
      if (!Array.isArray(invoicesList) || invoicesList.length === 0) {
        console.log("ℹ️ No invoices found in database");
        setInvoices([]);
        toast.success("No invoices yet. Create your first invoice!", {
          duration: 2000
        });
        setLoading(false);
        return;
      }
      
      // Transform the invoices data
      const transformedInvoices = invoicesList.map((invoice, index) => {
        console.log(`🔄 Transforming invoice ${index + 1}:`, invoice);
        
        // Handle nested data structure
        let data = invoice;
        
        // If invoice has a 'data' property, use that
        if (invoice.data && typeof invoice.data === 'object') {
          data = invoice.data;
          
          // Handle double-nested data
          if (data.data && typeof data.data === 'object') {
            data = data.data;
          }
        }
        
        const transformed = {
          id: invoice.id || invoice._id || `temp-${index}`,
          invoiceNumber: data.referenceNo || data.voucherNo || `INV-${(invoice.id || invoice._id || '').substring(0, 8)}`,
          reference: data.referenceNo || data.voucherNo || `REF-${(invoice.id || invoice._id || '').substring(0, 8)}`,
          hotelName: data.hotel || data.hotelName || "Unknown Hotel",
          guestName: data.guestName || "Guest",
          roomNumber: data.roomNo || data.roomNumber || "N/A",
          arrivalDate: data.arrivalDate || new Date().toISOString(),
          departureDate: data.departureDate || new Date().toISOString(),
          nights: data.nights || 0,
          grandTotal: parseFloat(data.grandTotal || data.total || 0),
          currency: data.currency || "TRY",
          status: data.status || "pending",
          pdfPath: data.pdfPath || null,
          createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
          rawData: invoice,
        };
        
        console.log(`✅ Transformed invoice ${index + 1}:`, transformed);
        return transformed;
      });

      console.log(`✅ Successfully transformed ${transformedInvoices.length} invoices`);
      setInvoices(transformedInvoices);
      
      toast.success(`Loaded ${transformedInvoices.length} invoice${transformedInvoices.length !== 1 ? 's' : ''}`, {
        duration: 2000
      });
      
    } catch (error) {
      console.error("❌ Error loading Turkey invoices:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast.error("Failed to load invoices. Please check your connection.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    if (!selectedHotelTemplate) {
      toast.error("Please select a hotel", { duration: 2000 });
      return;
    }
    
    navigate(`/invoice/create/${selectedHotelTemplate}`);
  };

  const handleViewInvoice = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      toast.error("Invoice not found");
      return;
    }
    
    navigate(`/invoice/view/${invoiceId}`);
  };

  const handleEditInvoice = (invoice) => {
    navigate(`/invoices/edit/${invoice.id}`);
  };

  const openDeleteModal = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setDeleteLoading(invoiceToDelete.id);
    setShowDeleteModal(false);

    try {
      await turkeyInvoiceApi.deleteInvoice(invoiceToDelete.id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
      toast.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully!`, {
        duration: 3000,
        icon: "🗑️"
      });
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error("Failed to delete invoice");
    } finally {
      setDeleteLoading(null);
      setInvoiceToDelete(null);
    }
  };

  const handleDownloadPDF = (invoice) => {
    if (invoice.pdfPath) {
      toast.success(`Downloading ${invoice.invoiceNumber}...`);
    } else {
      toast.error("PDF not available for this invoice yet!");
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      loadInvoices();
      return;
    }
    setSearchLoading(true);
    setTimeout(() => setSearchLoading(false), 500);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      searchTerm === "" ||
      inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "" || inv.status === filterStatus;
    const matchesHotel = filterHotel === "" || inv.hotelName === filterHotel;

    let matchesDateRange = true;
    if (selectedStartDate || selectedEndDate) {
      const invoiceArrival = new Date(inv.arrivalDate);
      const invoiceDeparture = new Date(inv.departureDate);
      invoiceArrival.setHours(0, 0, 0, 0);
      invoiceDeparture.setHours(0, 0, 0, 0);

      if (selectedStartDate && selectedEndDate) {
        const start = new Date(selectedStartDate);
        const end = new Date(selectedEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        matchesDateRange = invoiceArrival <= end && invoiceDeparture >= start;
      } else if (selectedStartDate) {
        const start = new Date(selectedStartDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = invoiceDeparture >= start;
      } else if (selectedEndDate) {
        const end = new Date(selectedEndDate);
        end.setHours(0, 0, 0, 0);
        matchesDateRange = invoiceArrival <= end;
      }
    }

    return matchesSearch && matchesStatus && matchesHotel && matchesDateRange;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "ready":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      ready: "Ready",
      pending: "Pending",
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  const handleDateClick = (day) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    newDate.setHours(0, 0, 0, 0);

    if (dateSelectionMode === "start") {
      setSelectedStartDate(newDate);
      setDateSelectionMode("end");
      if (selectedEndDate && newDate > selectedEndDate) {
        setSelectedEndDate(null);
      }
    } else {
      if (selectedStartDate && newDate < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(newDate);
      } else {
        setSelectedEndDate(newDate);
      }
      setShowCalendar(false);
      setDateSelectionMode("start");
      toast.success("Date range applied");
    }
  };

  const isDateInRange = (day) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    date.setHours(0, 0, 0, 0);
    if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return date >= start && date <= end;
    }
    return false;
  };

  const isStartDate = (day) => {
    if (!selectedStartDate) return false;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return date.toDateString() === selectedStartDate.toDateString();
  };

  const isEndDate = (day) => {
    if (!selectedEndDate) return false;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return date.toDateString() === selectedEndDate.toDateString();
  };

  const changeMonth = (offset) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };

  const getDateDisplayText = () => {
    if (selectedStartDate && selectedEndDate) {
      return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
    } else if (selectedStartDate) {
      return `From ${formatDate(selectedStartDate)}`;
    }
    return "Pick a date range";
  };

  const handleClear = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterHotel("");
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setDateSelectionMode("start");
    loadInvoices();
    toast.success("Filters cleared");
  };

  const clearDateFilter = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setDateSelectionMode("start");
  };

  if (loading || loadingHotels) {
    return (
      <div className="font-sans text-slate-800 p-4 sm:p-6 bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003d7a] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-800 p-3 sm:p-4 lg:p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Invoices List
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage and track hotel invoices • {filteredInvoices.length} total
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button className="btn btn-sm h-9 sm:h-10 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 gap-1 sm:gap-2 shadow-sm font-medium text-xs sm:text-sm px-3 sm:px-4">
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Bulk</span> PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Plus size={16} className="text-[#22c55e]" />
          Create New Invoice
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 sm:max-w-sm">
            <label className="label pb-1 text-xs font-semibold text-slate-600">
              Select Hotel
            </label>
            <select
              className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] focus:outline-none rounded-lg"
              value={selectedHotelTemplate}
              onChange={(e) => setSelectedHotelTemplate(e.target.value)}
              disabled={loadingHotels}
            >
              <option value="">
                {loadingHotels ? "Loading..." : "Choose hotel..."}
              </option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name} ({hotel.currency})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateInvoice}
            disabled={!selectedHotelTemplate || loadingHotels}
            className="btn btn-sm h-10 bg-[#22c55e] hover:bg-green-600 text-white border-none font-semibold shadow-md rounded-lg gap-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="label pb-1 text-xs font-semibold text-slate-600">
              Hotel
            </label>
            <select
              className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg"
              value={filterHotel}
              onChange={(e) => setFilterHotel(e.target.value)}
            >
              <option value="">All Hotels</option>
              {[...new Set(invoices.map(inv => inv.hotelName))].map((hotelName, idx) => (
                <option key={idx} value={hotelName}>
                  {hotelName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <label className="label pb-1 text-xs font-semibold text-slate-600">
              Status
            </label>
            <select
              className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 calendar-container relative">
            <label className="label pb-1 text-xs font-semibold text-slate-600">
              Date Range
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="input input-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] rounded-lg text-left flex items-center gap-2 text-slate-600 px-3"
              >
                <CalendarIcon size={14} className="text-slate-400 shrink-0" />
                <span className="truncate text-xs">{getDateDisplayText()}</span>
              </button>
              {(selectedStartDate || selectedEndDate) && (
                <button
                  onClick={clearDateFilter}
                  className="btn btn-ghost btn-sm h-10 w-10 min-h-0 p-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showCalendar && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1 hover:bg-slate-100 rounded-full"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-bold text-slate-700 text-sm">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1 hover:bg-slate-100 rounded-full"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="text-xs text-center mb-2 text-slate-500">
                  {dateSelectionMode === "start"
                    ? "Select start date"
                    : "Select end date"}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <span
                      key={index}
                      className="text-xs font-bold text-slate-400"
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth(currentDate) }).map(
                    (_, i) => (
                      <div key={`empty-${i}`} />
                    )
                  )}
                  {Array.from({ length: daysInMonth(currentDate) }).map(
                    (_, i) => {
                      const day = i + 1;
                      const isStart = isStartDate(day);
                      const isEnd = isEndDate(day);
                      const inRange = isDateInRange(day);

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`w-9 h-9 flex items-center justify-center text-sm rounded-full transition-colors ${
                            isStart || isEnd
                              ? "bg-[#003d7a] text-white font-bold"
                              : inRange
                                ? "bg-[#003d7a]/20 text-[#003d7a]"
                                : "hover:bg-[#003d7a] hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                  )}
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      setSelectedStartDate(today);
                      setSelectedEndDate(today);
                      setShowCalendar(false);
                      toast.success("Today selected");
                    }}
                    className="btn btn-ghost btn-xs flex-1 text-xs"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      weekAgo.setHours(0, 0, 0, 0);
                      today.setHours(0, 0, 0, 0);
                      setSelectedStartDate(weekAgo);
                      setSelectedEndDate(today);
                      setShowCalendar(false);
                      toast.success("Last 7 days selected");
                    }}
                    className="btn btn-ghost btn-xs flex-1 text-xs"
                  >
                    7 days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      monthAgo.setHours(0, 0, 0, 0);
                      today.setHours(0, 0, 0, 0);
                      setSelectedStartDate(monthAgo);
                      setSelectedEndDate(today);
                      setShowCalendar(false);
                      toast.success("Last 30 days selected");
                    }}
                    className="btn btn-ghost btn-xs flex-1 text-xs"
                  >
                    30 days
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label pb-1 text-xs font-semibold text-slate-600">
              Search
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Reference, guest, hotel..."
                className="input input-bordered w-full pl-10 h-10 bg-slate-50 text-sm focus:outline-none focus:border-[#003d7a] rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex gap-2">
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="btn btn-sm h-10 bg-[#003d7a] hover:bg-[#002a5c] text-white flex-1 border-none font-medium rounded-lg shadow-sm disabled:opacity-50 text-sm"
            >
              {searchLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
            <button
              onClick={handleClear}
              className="btn btn-sm h-10 btn-ghost bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg px-4 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No invoices found</h3>
          <p className="text-sm text-slate-500">
            {searchTerm || filterStatus || filterHotel || selectedStartDate
              ? "Try adjusting your filters"
              : "Create your first invoice to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[#f8fafc] border-b-2 border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">
                    Invoice Details
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">
                    Hotel / Guest
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">
                    Dates
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-blue-50/30 transition-colors group bg-white"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[#003d7a] text-sm">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inv.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        <span className="font-bold text-slate-800 text-sm truncate">
                          {inv.hotelName}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          {inv.guestName}
                        </span>
                        <span className="text-xs text-slate-400">
                          Room: {inv.roomNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="text-slate-700">
                          {formatDate(inv.arrivalDate)}
                        </span>
                        <span className="text-slate-700">
                          {formatDate(inv.departureDate)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {inv.nights} nights
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-800">
                          {inv.grandTotal.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {inv.currency}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(inv.status)}`}
                      >
                        {getStatusDisplay(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-1.5 text-slate-400 hover:text-[#003d7a] hover:bg-blue-50 rounded transition-colors"
                          title="Download PDF"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditInvoice(inv)}
                          className="p-1.5 text-slate-400 hover:text-[#f39c12] hover:bg-amber-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(inv)}
                          disabled={deleteLoading === inv.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteLoading === inv.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 px-2">
        <div>
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
        <div className="flex gap-4">
          <span>Pending: {invoices.filter((i) => i.status === "pending").length}</span>
          <span>Ready: {invoices.filter((i) => i.status === "ready").length}</span>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Delete Invoice
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete invoice{" "}
              <strong>{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-sm h-10 btn-ghost text-slate-600 font-medium"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm h-10 bg-red-500 hover:bg-red-600 text-white border-none font-medium"
                onClick={handleDeleteInvoice}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}