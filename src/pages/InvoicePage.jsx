"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Copy,
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
import invoiceApi from "../Api/invoice.api";
import cairoInvoiceApi from "../Api/cairoInvoice.api"; // ✅ Added Egypt API import
import { getHotelConfigs, getallInvoices } from "../Api/hotelConfig.api";

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

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // ✅ Helper to identify Egypt invoices globally
  const isEgyptInvoice = (hotelName) => {
    const name = (hotelName || "").toLowerCase();
    return name.includes("staybridge") || name.includes("cairo");
  };

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
      let hotelsList = [];
      if (response && response.data && Array.isArray(response.data)) {
        hotelsList = response.data;
      } else if (Array.isArray(response)) {
        hotelsList = response;
      }

      const transformedHotels = hotelsList.map((config) => ({
        id: config.id,
        name: config.hotel_name,
        code: config.currency || "TRY",
        currency: config.currency || "TRY",
      }));

      setHotels(transformedHotels);
    } catch (error) {
      toast.error("Failed to load hotel configurations");
      setHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await getallInvoices();
      if (typeof response === "string" && response.includes("<!doctype html>")) {
        toast.error("API endpoint error - Please check backend configuration");
        setInvoices([]);
        setLoading(false);
        return;
      }

      let invoicesList = [];

      if (response && response.data) {
        // 1. Tunisia invoices
        if (response.data.invoices && response.data.invoices.records) {
          response.data.invoices.records.forEach((invoiceRecord) => {
            const invoice = invoiceRecord.invoice;
            invoicesList.push({
              id: invoice.id || `tunisia-${invoice.id}`,
              invoiceNumber: invoice.reference_no || `TUN-${invoice.id}`,
              reference: invoice.reference_no || "",
              hotelName: invoice.hotel || "Novotel Tunis Lac",
              guestName: invoice.guest_name || "Guest",
              roomNumber: invoice.room_no || "N/A",
              arrivalDate: invoice.arrival_date || "",
              departureDate: invoice.departure_date || "",
              nights: invoice.nights || 0,
              grandTotal: parseFloat(invoice.grand_total || 0),
              currency: "TND",
              status: invoice.status || "ready",
              pdfPath: null,
              createdAt: invoice.created_at || new Date().toISOString(),
              rawData: invoiceRecord,
              invoiceType: "tunisia",
            });
          });
        }

        // 2. Turkey & Egypt invoices (Assuming Egypt will come through this route for now)
        if (response.data.turkey_hotels && response.data.turkey_hotels.records) {
          response.data.turkey_hotels.records.forEach((invoice, index) => {
            let data = invoice.data || {};
            if (data.data && typeof data.data === "object") data = data.data;

            invoicesList.push({
              id: invoice.id || invoice._id || `turkey-${index}`,
              invoiceNumber: data.referenceNo || data.voucherNo || data.reference_no || `INV-${(invoice.id || invoice._id || "").substring(0, 8)}`,
              reference: data.referenceNo || data.voucherNo || data.reference_no || `REF-${(invoice.id || invoice._id || "").substring(0, 8)}`,
              hotelName: data.hotel || data.hotelName || "Unknown Hotel",
              guestName: data.guestName || "Guest",
              roomNumber: data.roomNo || data.room_number || "N/A",
              arrivalDate: data.arrivalDate || data.arrival_date || new Date().toISOString(),
              departureDate: data.departureDate || data.departure_date || new Date().toISOString(),
              nights: data.nights || 0,
              grandTotal: parseFloat(data.grandTotal || data.total || data.grandTotalEgp || 0), // Added grandTotalEgp check
              currency: isEgyptInvoice(data.hotel) ? "EGP" : (data.currency || "TRY"), // Dynamic Currency
              status: data.status || "ready",
              pdfPath: data.pdfPath || null,
              createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
              rawData: invoice,
              invoiceType: isEgyptInvoice(data.hotel) ? "egypt" : "turkey", // Dynamic Type
            });
          });
        }
      }

      if (invoicesList.length === 0) {
        setInvoices([]);
        toast.success("No invoices yet. Create your first invoice!");
        return;
      }

      invoicesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(invoicesList);
    } catch (error) {
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

    const selectedHotel = hotels.find(h => String(h.id) === String(selectedHotelTemplate));
    const hotelName = selectedHotel?.name?.toLowerCase() || "";

    if (isEgyptInvoice(hotelName)) {
      navigate(`/egypt-invoice/create/${selectedHotelTemplate}`);
    } else if (selectedHotelTemplate === "8" || hotelName.includes("novotel")) {
      navigate(`/invoice/create/novotel/${selectedHotelTemplate}`);
    } else {
      navigate(`/invoice/create/${selectedHotelTemplate}`);
    }
  };

  // ✅ UPDATED VIEW HANDLER
  const handleViewInvoice = (invoiceId) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return toast.error("Invoice not found");

    if (isEgyptInvoice(invoice.hotelName)) {
      navigate(`/egypt-invoice/view/${invoiceId}`); // Route for Egypt View
    } else if (invoice.hotelName === "Novotel Tunis Lac") {
      navigate(`/invoice/nview/${invoice.id}`);
    } else {
      navigate(`/invoice/view/${invoiceId}`);
    }
  };

  // ✅ UPDATED EDIT HANDLER
  const handleEditInvoice = (invoice) => {
    if (isEgyptInvoice(invoice.hotelName)) {
      navigate(`/egypt-invoice/edit/${invoice.id}`); // Route for Egypt Edit
    } else if (invoice.hotelName === "Novotel Tunis Lac") {
      navigate(`/invoice/edit/${invoice.id}`);
    } else {
      navigate(`/invoices/edit/${invoice.id}`);
    }
  };

  // ✅ UPDATED PDF DOWNLOAD HANDLER
  const handleDownloadPDF = (invoice) => {
    if (isEgyptInvoice(invoice.hotelName)) {
      navigate(`/egypt-invoice/download-pdf/${invoice.id}`); // Route for Egypt PDF
    } else if (invoice.hotelName === "Novotel Tunis Lac") {
      navigate(`/invoices/nvdownload-pdf/${invoice.id}`);
    } else {
      navigate(`/invoices/download-pdf/${invoice.id}`);
    }
  };

  // ✅ UPDATED DELETE HANDLER
  const openDeleteModal = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setDeleteLoading(invoiceToDelete.id);
    setShowDeleteModal(false);

    try {
      if (isEgyptInvoice(invoiceToDelete.hotelName)) {
        await cairoInvoiceApi.deleteInvoice(invoiceToDelete.id); // Uses Cairo API
      } else if (invoiceToDelete.invoiceType === "turkey") {
        await turkeyInvoiceApi.deleteInvoice(invoiceToDelete.id); // Uses Turkey API
      } else {
        await invoiceApi.deleteInvoice(invoiceToDelete.id); // Uses Tunisia API
      }

      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
      toast.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully!`);
    } catch (error) {
      toast.error("Failed to delete invoice");
    } finally {
      setDeleteLoading(null);
      setInvoiceToDelete(null);
    }
  };

  // UI Handlers
  const handleSearch = () => {
    if (!searchTerm.trim()) return loadInvoices();
    setSearchLoading(true);
    setTimeout(() => setSearchLoading(false), 500);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = searchTerm === "" ||
      inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "" || inv.status === filterStatus;
    const matchesHotel = filterHotel === "" || inv.hotelName === filterHotel;

    let matchesDateRange = true;
    if (selectedStartDate || selectedEndDate) {
      const invoiceArrival = new Date(inv.arrivalDate).setHours(0, 0, 0, 0);
      const invoiceDeparture = new Date(inv.departureDate).setHours(0, 0, 0, 0);
      if (selectedStartDate && selectedEndDate) {
        matchesDateRange = invoiceArrival <= selectedEndDate.getTime() && invoiceDeparture >= selectedStartDate.getTime();
      } else if (selectedStartDate) {
        matchesDateRange = invoiceDeparture >= selectedStartDate.getTime();
      } else if (selectedEndDate) {
        matchesDateRange = invoiceArrival <= selectedEndDate.getTime();
      }
    }
    return matchesSearch && matchesStatus && matchesHotel && matchesDateRange;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return dateString; }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "ready": return "bg-green-100 text-green-700 border border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border border-amber-200";
      default: return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const getStatusDisplay = (status) => status?.toLowerCase() === "ready" ? "Ready" : "Pending";
  
  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    newDate.setHours(0, 0, 0, 0);
    if (dateSelectionMode === "start") {
      setSelectedStartDate(newDate);
      setDateSelectionMode("end");
      if (selectedEndDate && newDate > selectedEndDate) setSelectedEndDate(null);
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
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).setHours(0, 0, 0, 0);
    return selectedStartDate && selectedEndDate && date >= selectedStartDate.getTime() && date <= selectedEndDate.getTime();
  };
  const isStartDate = (day) => selectedStartDate && new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() === selectedStartDate.toDateString();
  const isEndDate = (day) => selectedEndDate && new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() === selectedEndDate.toDateString();
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const getDateDisplayText = () => {
    if (selectedStartDate && selectedEndDate) return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
    if (selectedStartDate) return `From ${formatDate(selectedStartDate)}`;
    return "Pick a date range";
  };
  const handleClear = () => {
    setSearchTerm(""); setFilterStatus(""); setFilterHotel(""); setSelectedStartDate(null); setSelectedEndDate(null); setDateSelectionMode("start"); loadInvoices(); toast.success("Filters cleared");
  };
  const clearDateFilter = () => { setSelectedStartDate(null); setSelectedEndDate(null); setDateSelectionMode("start"); };

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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Invoices List</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage and track hotel invoices • {filteredInvoices.length} total</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button className="btn btn-sm h-9 sm:h-10 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 gap-1 sm:gap-2 shadow-sm font-medium text-xs sm:text-sm px-3 sm:px-4">
            <Download size={14} className="sm:w-4 sm:h-4" /><span className="hidden sm:inline">Bulk</span> PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Plus size={16} className="text-[#22c55e]" /> Create New Invoice
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 sm:max-w-sm">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Select Hotel</label>
            <select className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] focus:outline-none rounded-lg" value={selectedHotelTemplate} onChange={(e) => setSelectedHotelTemplate(e.target.value)} disabled={loadingHotels}>
              <option value="">{loadingHotels ? "Loading..." : "Choose hotel..."}</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>{hotel.name} ({hotel.currency})</option>
              ))}
            </select>
          </div>
          <button onClick={handleCreateInvoice} disabled={!selectedHotelTemplate || loadingHotels} className="btn btn-sm h-10 bg-[#22c55e] hover:bg-green-600 text-white border-none font-semibold shadow-md rounded-lg gap-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={16} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
       <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px] sm:min-w-[180px]">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Hotel</label>
            <select className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg" value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)}>
              <option value="">All Hotels</option>
              {[...new Set(invoices.map((inv) => inv.hotelName))].map((hotelName, idx) => (
                <option key={idx} value={hotelName}>{hotelName}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px] sm:min-w-[180px]">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Status</label>
            <select className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 calendar-container relative">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Date Range</label>
            <div className="flex gap-2">
              <button onClick={() => setShowCalendar(!showCalendar)} className="input input-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] rounded-lg text-left flex items-center gap-2 text-slate-600 px-3">
                <CalendarIcon size={14} className="text-slate-400 shrink-0" />
                <span className="truncate text-xs">{getDateDisplayText()}</span>
              </button>
              {(selectedStartDate || selectedEndDate) && (
                <button onClick={clearDateFilter} className="btn btn-ghost btn-sm h-10 w-10 min-h-0 p-0">
                  <X size={16} />
                </button>
              )}
            </div>

            {showCalendar && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
                  <span className="font-bold text-slate-700 text-sm">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
                </div>
                <div className="text-xs text-center mb-2 text-slate-500">{dateSelectionMode === "start" ? "Select start date" : "Select end date"}</div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <span key={index} className="text-xs font-bold text-slate-400">{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => (<div key={`empty-${i}`} />))}
                  {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                      const day = i + 1;
                      const isStart = isStartDate(day);
                      const isEnd = isEndDate(day);
                      const inRange = isDateInRange(day);

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`w-9 h-9 flex items-center justify-center text-sm rounded-full transition-colors ${
                            isStart || isEnd ? "bg-[#003d7a] text-white font-bold" : inRange ? "bg-[#003d7a]/20 text-[#003d7a]" : "hover:bg-[#003d7a] hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                  )}
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-slate-200">
                  <button onClick={() => { const today = new Date(); today.setHours(0, 0, 0, 0); setSelectedStartDate(today); setSelectedEndDate(today); setShowCalendar(false); toast.success("Today selected"); }} className="btn btn-ghost btn-xs flex-1 text-xs">Today</button>
                  <button onClick={() => { const today = new Date(); const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); weekAgo.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0); setSelectedStartDate(weekAgo); setSelectedEndDate(today); setShowCalendar(false); toast.success("Last 7 days selected"); }} className="btn btn-ghost btn-xs flex-1 text-xs">7 days</button>
                  <button onClick={() => { const today = new Date(); const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); monthAgo.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0); setSelectedStartDate(monthAgo); setSelectedEndDate(today); setShowCalendar(false); toast.success("Last 30 days selected"); }} className="btn btn-ghost btn-xs flex-1 text-xs">30 days</button>
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Reference, guest, hotel..." className="input input-bordered w-full pl-10 h-10 bg-slate-50 text-sm focus:outline-none focus:border-[#003d7a] rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSearch()} />
            </div>
          </div>

         <div className="flex gap-2 flex-wrap">
            <button onClick={handleSearch} disabled={searchLoading} className="btn btn-sm h-10 bg-[#003d7a] hover:bg-[#002a5c] text-white flex-1 border-none font-medium rounded-lg shadow-sm disabled:opacity-50 text-sm">
              {searchLoading ? (<><Loader2 size={14} className="animate-spin mr-1" /> Searching...</>) : ("Search")}
            </button>
            <button onClick={handleClear} className="btn btn-sm h-10 btn-ghost bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg px-4 text-sm">
              Clear
            </button>
          </div>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText size={64} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No invoices found</h3>
          <p className="text-sm text-slate-500">{searchTerm || filterStatus || filterHotel || selectedStartDate ? "Try adjusting your filters" : "Create your first invoice to get started"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-[#f8fafc] border-b-2 border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">Invoice Details</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">Hotel / Guest</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left whitespace-nowrap">Dates</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Amount</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group bg-white">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[#003d7a] text-sm">{inv.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{String(inv.id).substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        <span className="font-bold text-slate-800 text-sm truncate">{inv.hotelName}</span>
                        <span className="text-xs text-slate-500 truncate">{inv.guestName}</span>
                        <span className="text-xs text-slate-400">Room: {inv.roomNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="text-slate-700">{formatDate(inv.arrivalDate)}</span>
                        <span className="text-slate-700">{formatDate(inv.departureDate)}</span>
                        <span className="text-[10px] text-slate-400">{inv.nights} nights</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-800">{inv.grandTotal.toFixed(2)}</span>
                        <span className="text-xs text-slate-500">{inv.currency}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(inv.status)}`}>
                        {getStatusDisplay(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownloadPDF(inv)} className="p-1.5 text-slate-400 hover:text-[#003d7a] hover:bg-blue-50 rounded transition-colors" title="Download PDF">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => {
                            // ✅ UPDATED: DUPLICATE LOGIC
                            let dupPath = `/invoices/duplicate/${inv.id}`;
                            if (isEgyptInvoice(inv.hotelName)) {
                              dupPath = `/egypt-invoice/duplicate/${inv.id}`;
                            } else if (inv.hotelName === "Novotel Tunis Lac") {
                              dupPath = `/invoices/novotel/duplicate/${inv.id}`;
                            }
                            navigate(dupPath);
                          }} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => handleViewInvoice(inv.id)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEditInvoice(inv)} className="p-1.5 text-slate-400 hover:text-[#f39c12] hover:bg-amber-50 rounded transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => openDeleteModal(inv)} disabled={deleteLoading === inv.id} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Delete">
                          {deleteLoading === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
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
        <div>Showing {filteredInvoices.length} of {invoices.length} invoices</div>
        <div className="flex gap-4">
          <span>Pending: {invoices.filter((i) => i.status === "pending").length}</span>
          <span>Ready: {invoices.filter((i) => i.status === "ready").length}</span>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-2">Delete Invoice</h3>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-sm h-10 btn-ghost text-slate-600 font-medium" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-sm h-10 bg-red-500 hover:bg-red-600 text-white border-none font-medium" onClick={handleDeleteInvoice}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}