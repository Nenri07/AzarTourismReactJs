"use client";
import React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Copy, Plus, Edit2, Trash2, CalendarIcon,
  ChevronLeft, ChevronRight, ChevronDown, FileText, Eye, X, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import turkeyInvoiceApi from "../Api/turkeyInvoice.api";
import invoiceApi from "../Api/invoice.api";
import cairoInvoiceApi from "../Api/cairoInvoice.api";
import malaysiaInvoiceApi from "../Api/malaysiaInvoice.api";
import ukInvoiceApi from "../Api/ukInvoice.api";
import tunisiainvoiceApi from "../Api/tunisiainvoice.api";
import { getCountries, getHotelsByCountry, getallInvoices } from "../Api/hotelConfig.api";

// ── Pagination config ──────────────────────────────────────────────────────
const INVOICES_PER_PAGE = 20;

export default function InvoicePage() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [availableCountries, setAvailableCountries] = useState([]);
  const [loadingCountries, setLoadingCountries]     = useState(true);
  const [hotels, setHotels]                         = useState([]);
  const [loadingHotels, setLoadingHotels]           = useState(false);
  const [invoices, setInvoices]                     = useState([]);
  const [loading, setLoading]                       = useState(true);
  const [searchLoading, setSearchLoading]           = useState(false);
  const [deleteLoading, setDeleteLoading]           = useState(null);
  const [selectedHotelTemplate, setSelectedHotelTemplate] = useState("");
  const [showCalendar, setShowCalendar]             = useState(false);
  const [selectedStartDate, setSelectedStartDate]   = useState(null);
  const [selectedEndDate, setSelectedEndDate]       = useState(null);
  const [dateSelectionMode, setDateSelectionMode]   = useState("start");
  const [searchTerm, setSearchTerm]                 = useState("");
  const [filterStatus, setFilterStatus]             = useState("");
  const [filterHotel, setFilterHotel]               = useState("");
  const [currentDate, setCurrentDate]               = useState(new Date());
  const [showDeleteModal, setShowDeleteModal]       = useState(false);
  const [invoiceToDelete, setInvoiceToDelete]       = useState(null);
  const [invoicePage, setInvoicePage]               = useState(1);

  // Cascading searchable dropdowns
  const [selectedCountry, setSelectedCountry]       = useState("");
  const [hotelSearchTerm, setHotelSearchTerm]       = useState("");
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
  const [activeHotelIndex, setActiveHotelIndex]     = useState(0);

  const daysInMonth    = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // ─── Hotel type detectors (UNCHANGED) ────────────────────────────────────
  const isUKInvoice = (hotelName, country, currency) => {
    const name = (hotelName || "").toLowerCase();
    const c    = (country   || "").toLowerCase();
    const cur  = (currency  || "").toUpperCase();
    if (c === "uk" || c === "united kingdom" || cur === "GBP") return true;
    return (
      name.includes("hilton london") || name.includes("london hilton") ||
      name.includes("hilton metropole") || name.includes("four seasons london") ||
      name.includes("park plaza") || name.includes("marriott park lane") ||
      name.includes("london marriott") || name.includes("mandarin oriental") ||
      name.includes("hyatt regency london") ||
      name.includes("hyatt regency - the churchill") || name.includes("the churchill")
    );
  };

  const isEgyptInvoice = (hotelName) => {
    const name = (hotelName || "").toLowerCase();
    return (
      name.includes("staybridge") || name.includes("cairo") ||
      name.includes("fairmont") || name.includes("fairmount") ||
      name.includes("holiday") ||
      (name.includes("radisson") && name.includes("cairo")) ||
      (name.includes("intercontinental") && !name.includes("kuala lumpur"))
    );
  };

  const isMalaysiaInvoice = (hotelName) => {
    const name = (hotelName || "").toLowerCase();
    return (
      name.includes("grand hyatt") || name.includes("trillion suites") ||
      name.includes("oasia") || name.includes("intercontinental kuala lumpur") ||
      name.includes("lanson place") || name.includes("perdana") ||
      name.includes("pullman") || name.includes("somerset")
    );
  };

  const isTurkey2Invoice = (hotelName) => {
    const name = (hotelName || "").toLowerCase();
    return (
      name.includes("radisson collection") ||
      name.includes("radisson blu hotel istanbul sisli") ||
      name.includes("hilton istanbul bosphorus") ||
      name.includes("marmara taksim") || name.includes("yotelair") ||
      name.includes("cheya") || name.includes("radisson hotel istanbul harbiye")
    );
  };

  const isTunisiaInvoice = (hotelName, country, currency) => {
    const name = (hotelName || "").toLowerCase();
    const c    = (country   || "").toLowerCase();
    const cur  = (currency  || "").toUpperCase();
    if (c === "tunisia" || c === "tunis" || cur === "TND") return true;
    return (
      name.includes("novotel tunis") || name.includes("adam hotel") ||
      name.includes("radisson blu tunis") || name.includes("concorde") ||
      name.includes("movenpick") || name.includes("mövenpick") ||
      name.includes("le corail") || name.includes("four seasons tunis") ||
      name.includes("sheraton tunis") || name.includes("tunis marriott hotel")
    );
  };

  // ─── resolveInvoiceType (UNCHANGED) ──────────────────────────────────────
  const resolveInvoiceType = useCallback((invoice) => {
    if (invoice.invoiceType === "uk")       return "uk";
    if (invoice.invoiceType === "malaysia") return "malaysia";
    if (invoice.invoiceType === "egypt")    return "egypt";
    if (invoice.invoiceType === "tunisia")  return "tunisia";

    const hotelConfig = hotels.find((h) => h.name === invoice.hotelName);
    const country  = (hotelConfig?.country  || "").toLowerCase();
    const currency = (invoice.currency || hotelConfig?.currency || "").toUpperCase();
    const name     = (invoice.hotelName || "").toLowerCase();

    if (isUKInvoice(name, country, currency))                                    return "uk";
    if (isTurkey2Invoice(name))                                                  return "turkey2";
    if (country === "malaysia" || currency === "MYR" || isMalaysiaInvoice(name)) return "malaysia";
    if (country === "egypt"    || currency === "EGP" || isEgyptInvoice(name))    return "egypt";
    if (isTunisiaInvoice(name, country, currency))                               return "tunisia";
    return "turkey";
  }, [hotels]);

  // ─── Load countries on mount (replaces loadHotels) ───────────────────────
  const loadCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const response = await getCountries();
      // API returns array of country strings or objects — normalize both
      const raw = response?.data || response || [];
      const countries = raw
        .map((c) => (typeof c === "string" ? c : c.country || c.name || ""))
        .filter(Boolean)
        .sort();
      setAvailableCountries(countries);
    } catch (err) {
      toast.error("Failed to load countries");
      setAvailableCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  // ─── Load hotels only when a country is selected ─────────────────────────
  const loadHotelsByCountry = useCallback(async (country) => {
    if (!country) { setHotels([]); return; }
    setLoadingHotels(true);
    try {
      const response = await getHotelsByCountry(country);
      const raw = response?.data || response || [];
      const transformed = raw.map((config) => ({
        id:       config.id,
        name:     config.hotel_name,
        code:     config.currency || "TRY",
        currency: config.currency || "TRY",
        country:  config.country  || country,
      }));
      setHotels(transformed);
    } catch (err) {
      toast.error("Failed to load hotels for " + country);
      setHotels([]);
    } finally {
      setLoadingHotels(false);
    }
  }, []);

  // ─── Country selection handler ────────────────────────────────────────────
  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country);
    setSelectedHotelTemplate("");
    setHotelSearchTerm("");
    setHotels([]); // clear previous country's hotels immediately
    if (country) loadHotelsByCountry(country);
  }, [loadHotelsByCountry]);

  // ─── Filtered hotels inside dropdown (memoized) ───────────────────────────
  const filteredHotelsByCountry = useMemo(() => {
    if (!hotelSearchTerm) return hotels;
    const lower = hotelSearchTerm.toLowerCase();
    return hotels.filter((h) => h.name?.toLowerCase().includes(lower));
  }, [hotels, hotelSearchTerm]);

  // ─── Load invoices (UNCHANGED logic, just useCallback wrapped) ───────────
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getallInvoices();
      if (typeof response === "string" && response.includes("<!doctype html>")) {
        toast.error("API endpoint error - Please check backend configuration");
        setInvoices([]); setLoading(false); return;
      }

      let invoicesList = [];

      if (response && response.data) {
        // 1. OLD Tunisia
        if (response.data.invoices?.records) {
          response.data.invoices.records.forEach((invoiceRecord) => {
            const invoice = invoiceRecord.invoice;
            invoicesList.push({
              id: invoice.id || `tunisia-old-${invoice.id}`,
              invoiceNumber: invoice.reference_no || `TUN-${invoice.id}`,
              reference: invoice.reference_no || "",
              hotelName: invoice.hotel || "Novotel Tunis Lac",
              guestName: invoice.guest_name || "Guest",
              roomNumber: invoice.room_no || "N/A",
              arrivalDate: invoice.arrival_date || "",
              departureDate: invoice.departure_date || "",
              nights: invoice.nights || 0,
              grandTotal: parseFloat(invoice.grand_total || 0),
              currency: "TND", status: invoice.status || "ready",
              pdfPath: null, createdAt: invoice.created_at || new Date().toISOString(),
              rawData: invoiceRecord, invoiceType: "tunisia",
            });
          });
        }
        // 2. NEW Tunisia
        if (response.data.tunisia_hotels?.records) {
          response.data.tunisia_hotels.records.forEach((invoice, index) => {
            let d = invoice.data || {};
            if (d.data && typeof d.data === "object") d = d.data;
            invoicesList.push({
              id: invoice.id || invoice._id || `tunisia-${index}`,
              invoiceNumber: d.invoiceNo || d.folioNo || d.confirmationNo || `TUN-${(invoice.id||"").substring(0,8)}`,
              reference: d.invoiceNo || d.folioNo || "",
              hotelName: d.hotel || "Unknown Hotel", guestName: d.guestName || "Guest",
              roomNumber: d.roomNo || "N/A",
              arrivalDate: d.arrivalDate || new Date().toISOString(),
              departureDate: d.departureDate || new Date().toISOString(),
              nights: d.nights || 0, grandTotal: parseFloat(d.grandTotalTnd || d.totalTtc || 0),
              currency: "TND", status: d.status || "pending", pdfPath: null,
              createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
              rawData: invoice, invoiceType: "tunisia",
            });
          });
        }
        // 3. Turkey
        if (response.data.turkey_hotels?.records) {
          response.data.turkey_hotels.records.forEach((invoice, index) => {
            let d = invoice.data || {};
            if (d.data && typeof d.data === "object") d = d.data;
            invoicesList.push({
              id: invoice.id || invoice._id || `turkey-${index}`,
              invoiceNumber: d.referenceNo || d.voucherNo || d.reference_no || `INV-${(invoice.id||invoice._id||"").substring(0,8)}`,
              reference: d.referenceNo || d.voucherNo || d.reference_no || `REF-${(invoice.id||invoice._id||"").substring(0,8)}`,
              hotelName: d.hotel || d.hotelName || "Unknown Hotel", guestName: d.guestName || "Guest",
              roomNumber: d.roomNo || d.room_number || "N/A",
              arrivalDate: d.arrivalDate || d.arrival_date || new Date().toISOString(),
              departureDate: d.departureDate || d.departure_date || new Date().toISOString(),
              nights: d.nights || 0, grandTotal: parseFloat(d.grandTotal || d.total || 0),
              currency: d.currency || "TRY", status: d.status || "ready",
              pdfPath: d.pdfPath || null,
              createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
              rawData: invoice, invoiceType: null,
            });
          });
        }
        // 4. Egypt
        if (response.data.egypt_hotels?.records) {
          response.data.egypt_hotels.records.forEach((invoice, index) => {
            let d = invoice.data || {};
            if (d.data && typeof d.data === "object") d = d.data;
            invoicesList.push({
              id: invoice.id || invoice._id || `egypt-${index}`,
              invoiceNumber: d.referenceNo || d.voucherNo || d.reference_no || `INV-${(invoice.id||invoice._id||"").substring(0,8)}`,
              reference: d.referenceNo || d.voucherNo || d.reference_no || `REF-${(invoice.id||invoice._id||"").substring(0,8)}`,
              hotelName: d.hotel || d.hotelName || "Unknown Hotel", guestName: d.guestName || "Guest",
              roomNumber: d.roomNo || d.room_number || "N/A",
              arrivalDate: d.arrivalDate || d.arrival_date || new Date().toISOString(),
              departureDate: d.departureDate || d.departure_date || new Date().toISOString(),
              nights: d.nights || 0, grandTotal: parseFloat(d.grandTotalEgp || d.total || 0),
              currency: d.currency || "EGP", status: d.status || "ready",
              pdfPath: d.pdfPath || null,
              createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
              rawData: invoice, invoiceType: "egypt",
            });
          });
        }
        // 5. Malaysia
        if (response.data.malaysia_hotels?.records) {
          response.data.malaysia_hotels.records.forEach((invoice, index) => {
            let d = invoice.data || {};
            if (d.data && typeof d.data === "object") d = d.data;
            invoicesList.push({
              id: invoice.id || invoice._id || `malaysia-${index}`,
              invoiceNumber: d.referenceNo || d.reference_no || `INV-${(invoice.id||invoice._id||"").substring(0,8)}`,
              referenceNo: d.referenceNo || d.reference_no || "",
              hotelName: d.hotel || d.hotelName || "Unknown Hotel",
              guestName: d.guestName || d.attention || "Guest",
              roomNumber: d.roomNo || d.room_number || "N/A",
              arrivalDate: d.arrivalDate || d.arrival_date || new Date().toISOString(),
              departureDate: d.departureDate || d.departure_date || new Date().toISOString(),
              nights: d.nights || 0, grandTotal: parseFloat(d.grandTotalMyr || d.total || 0),
              currency: d.currency || "MYR", status: d.status || "ready",
              pdfPath: d.pdfPath || null,
              createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
              rawData: invoice, invoiceType: "malaysia",
            });
          });
        }
        // 6. UK
        if (response.data.uk_hotels?.records) {
          response.data.uk_hotels.records.forEach((invoice, index) => {
            let d = invoice.data || {};
            if (d.data && typeof d.data === "object") d = d.data;
            invoicesList.push({
              id: invoice.id || invoice._id || `uk-${index}`,
              invoiceNumber: d.vatInvoiceNo || d.invoiceNo || d.referenceNo || `INV-${(invoice.id||invoice._id||"").substring(0,8)}`,
              reference: d.referenceNo || d.vatInvoiceNo || d.invoiceNo || "",
              hotelName: d.hotel || d.hotelName || "Unknown Hotel", guestName: d.guestName || "Guest",
              roomNumber: d.roomNo || d.room_number || "N/A",
              arrivalDate: d.arrivalDate || d.arrival_date || new Date().toISOString(),
              departureDate: d.departureDate || d.departure_date || new Date().toISOString(),
              nights: d.nights || 0,
              grandTotal: parseFloat(d.totalAmountPayable || d.grandTotalGbp || d.total || 0),
              currency: d.currency || "GBP", status: d.status || "ready",
              pdfPath: d.pdfPath || null,
              createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
              rawData: invoice, invoiceType: "uk",
            });
          });
        }

        // 7. Tunisia (Explicit Fetch from dedicated API)
        try {
          const tounisRes = await tunisiainvoiceApi.getAllInvoices();
          const tounisData = tounisRes.data || tounisRes || [];
          if (Array.isArray(tounisData)) {
            tounisData.forEach((invoice, index) => {
              let d = invoice.data || invoice;
              if (d.data && typeof d.data === "object") d = d.data;
              
              // Avoid duplicates if already in dashboard response
              const invId = invoice.id || invoice._id;
              if (invoicesList.some(inv => inv.id === invId)) return;

              invoicesList.push({
                id: invId || `tounis-${index}`,
                invoiceNumber: d.invoiceNo || d.folioNo || d.confirmationNo || `TUN-${(String(invId)||"").substring(0,8)}`,
                reference: d.invoiceNo || d.folioNo || "",
                hotelName: d.hotel || d.hotelName || "Unknown Hotel", 
                guestName: d.guestName || "Guest",
                roomNumber: d.roomNo || "N/A",
                arrivalDate: d.arrivalDate || new Date().toISOString(),
                departureDate: d.departureDate || new Date().toISOString(),
                nights: d.nights || 0, 
                grandTotal: parseFloat(d.grandTotalTnd || d.totalTtc || d.grandTotal || 0),
                currency: "TND", 
                status: d.status || "ready", 
                pdfPath: d.pdfPath || null,
                createdAt: invoice.created_at || invoice.createdAt || new Date().toISOString(),
                rawData: invoice, 
                invoiceType: "tunisia",
              });
            });
          }
        } catch (err) {
          console.error("Failed to fetch tounis invoices separately:", err);
        }
      }

      if (invoicesList.length === 0) {
        setInvoices([]);
        toast.success("No invoices yet. Create your first invoice!");
        return;
      }
      invoicesList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(invoicesList);
      toast.success(`Loaded ${invoicesList.length} invoice${invoicesList.length !== 1 ? "s" : ""}`, { duration: 2000 });
    } catch (error) {
      toast.error("Failed to load invoices. Please check your connection.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCountries();
    loadInvoices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCalendar && !e.target.closest(".calendar-container")) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isHotelDropdownOpen && !e.target.closest(".hotel-dropdown-container")) setIsHotelDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isHotelDropdownOpen]);

  // ─── Client-side filtered + paginated invoices (useMemo) ─────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        searchTerm === "" ||
        inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "" || inv.status === filterStatus;
      const matchesHotel  = filterHotel  === "" || inv.hotelName === filterHotel;

      let matchesDateRange = true;
      if (selectedStartDate || selectedEndDate) {
        const arrival   = new Date(inv.arrivalDate).setHours(0, 0, 0, 0);
        const departure = new Date(inv.departureDate).setHours(0, 0, 0, 0);
        if (selectedStartDate && selectedEndDate) {
          matchesDateRange = arrival <= selectedEndDate.getTime() && departure >= selectedStartDate.getTime();
        } else if (selectedStartDate) {
          matchesDateRange = departure >= selectedStartDate.getTime();
        } else {
          matchesDateRange = arrival <= selectedEndDate.getTime();
        }
      }
      return matchesSearch && matchesStatus && matchesHotel && matchesDateRange;
    });
  }, [invoices, searchTerm, filterStatus, filterHotel, selectedStartDate, selectedEndDate]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setInvoicePage(1); }, [searchTerm, filterStatus, filterHotel, selectedStartDate, selectedEndDate]);

  const totalInvoicePages = Math.max(1, Math.ceil(filteredInvoices.length / INVOICES_PER_PAGE));

  const paginatedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * INVOICES_PER_PAGE;
    return filteredInvoices.slice(start, start + INVOICES_PER_PAGE);
  }, [filteredInvoices, invoicePage]);

  const invoicePageNumbers = useMemo(() => {
    const pages = [];
    if (totalInvoicePages <= 7) {
      for (let i = 1; i <= totalInvoicePages; i++) pages.push(i);
    } else if (invoicePage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalInvoicePages);
    } else if (invoicePage >= totalInvoicePages - 3) {
      pages.push(1, "...", totalInvoicePages - 4, totalInvoicePages - 3, totalInvoicePages - 2, totalInvoicePages - 1, totalInvoicePages);
    } else {
      pages.push(1, "...", invoicePage - 1, invoicePage, invoicePage + 1, "...", totalInvoicePages);
    }
    return pages;
  }, [invoicePage, totalInvoicePages]);

  // ─── Route resolvers (UNCHANGED) ─────────────────────────────────────────
  const handleCreateInvoice = () => {
    if (!selectedHotelTemplate) { toast.error("Please select a hotel", { duration: 2000 }); return; }
    const selectedHotel = hotels.find((h) => String(h.id) === String(selectedHotelTemplate));
    const hotelName     = (selectedHotel?.name    || "").toLowerCase();
    const hotelCountry  = (selectedHotel?.country || "").toLowerCase();
    const hotelCurrency = (selectedHotel?.currency|| "").toUpperCase();

    if (isUKInvoice(hotelName, hotelCountry, hotelCurrency))                                    navigate(`/uk-invoice/create/${selectedHotelTemplate}`);
    else if (isTurkey2Invoice(hotelName))                                                        navigate(`/turkey-invoice/create/${selectedHotelTemplate}`);
    else if (hotelCountry === "malaysia" || hotelCurrency === "MYR" || isMalaysiaInvoice(hotelName)) navigate(`/malaysia-invoice/create/${selectedHotelTemplate}`);
    else if (hotelCountry === "egypt"    || hotelCurrency === "EGP" || isEgyptInvoice(hotelName))    navigate(`/egypt-invoice/create/${selectedHotelTemplate}`);
    else if (isTunisiaInvoice(hotelName, hotelCountry, hotelCurrency))                           navigate(`/tunisia-invoice/create/${selectedHotelTemplate}`);
    else                                                                                          navigate(`/invoice/create/${selectedHotelTemplate}`);
  };

  const handleViewInvoice = (invoiceId) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return toast.error("Invoice not found");
    const type = resolveInvoiceType(invoice);
    if      (type === "uk")       navigate(`/uk-invoice/view/${invoiceId}`);
    else if (type === "turkey2")  navigate(`/turkey-invoice/view/${invoiceId}`);
    else if (type === "malaysia") navigate(`/malaysia-invoice/view/${invoiceId}`);
    else if (type === "egypt")    navigate(`/egypt-invoice/view/${invoiceId}`);
    else if (type === "tunisia")  navigate(`/tunisia-invoice/view/${invoiceId}`);
    else                          navigate(`/invoice/view/${invoiceId}`);
  };

  const handleEditInvoice = (invoice) => {
    const type = resolveInvoiceType(invoice);
    if      (type === "uk")       navigate(`/uk-invoice/edit/${invoice.id}`);
    else if (type === "turkey2")  navigate(`/turkey-invoice/edit/${invoice.id}`);
    else if (type === "malaysia") navigate(`/malaysia-invoice/edit/${invoice.id}`);
    else if (type === "egypt")    navigate(`/egypt-invoice/edit/${invoice.id}`);
    else if (type === "tunisia")  navigate(`/tunisia-invoice/edit/${invoice.id}`);
    else                          navigate(`/invoices/edit/${invoice.id}`);
  };

  const handleDownloadPDF = (invoice) => {
    const type = resolveInvoiceType(invoice);
    if      (type === "uk")       navigate(`/uk-invoice/download-pdf/${invoice.id}`);
    else if (type === "turkey2")  navigate(`/turkey-invoice/download-pdf/${invoice.id}`);
    else if (type === "malaysia") navigate(`/malaysia-invoice/download-pdf/${invoice.id}`);
    else if (type === "egypt")    navigate(`/egypt-invoice/download-pdf/${invoice.id}`);
    else if (type === "tunisia")  navigate(`/tunisia-invoice/download-pdf/${invoice.id}`);
    else                          navigate(`/invoices/download-pdf/${invoice.id}`);
  };

  const handleDuplicateInvoice = (inv) => {
    const type = resolveInvoiceType(inv);
    if      (type === "uk")       navigate(`/uk-invoice/duplicate/${inv.id}`);
    else if (type === "turkey2")  navigate(`/turkey-invoice/duplicate/${inv.id}`);
    else if (type === "malaysia") navigate(`/malaysia-invoice/duplicate/${inv.id}`);
    else if (type === "egypt")    navigate(`/egypt-invoice/duplicate/${inv.id}`);
    else if (type === "tunisia")  navigate(`/tunisia-invoice/duplicate/${inv.id}`);
    else                          navigate(`/invoices/duplicate/${inv.id}`);
  };

  // ─── Delete (UNCHANGED) ───────────────────────────────────────────────────
  const openDeleteModal = (invoice) => { setInvoiceToDelete(invoice); setShowDeleteModal(true); };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setDeleteLoading(invoiceToDelete.id);
    setShowDeleteModal(false);
    try {
      const type = resolveInvoiceType(invoiceToDelete);
      if      (type === "uk")       await ukInvoiceApi.deleteInvoice(invoiceToDelete.id);
      else if (type === "malaysia") await malaysiaInvoiceApi.deleteInvoice(invoiceToDelete.id);
      else if (type === "egypt")    await cairoInvoiceApi.deleteInvoice(invoiceToDelete.id);
      else if (type === "tunisia")  await tunisiainvoiceApi.deleteInvoice(invoiceToDelete.id);
      else if (type === "turkey2")  await turkeyInvoiceApi.deleteInvoice(invoiceToDelete.id);
      else                          await invoiceApi.deleteInvoice(invoiceToDelete.id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
      toast.success(`Invoice ${invoiceToDelete.invoiceNumber} deleted successfully!`);
    } catch (error) {
      toast.error("Failed to delete invoice");
    } finally {
      setDeleteLoading(null); setInvoiceToDelete(null);
    }
  };

  // ─── UI helpers (UNCHANGED) ───────────────────────────────────────────────
  const handleSearch = () => {
    if (!searchTerm.trim()) return loadInvoices();
    setSearchLoading(true);
    setTimeout(() => setSearchLoading(false), 500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try { return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return dateString; }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "ready":   return "bg-green-100 text-green-700 border border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border border-amber-200";
      default:        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  };

  const getStatusDisplay = (status) => (status?.toLowerCase() === "ready" ? "Ready" : "Pending");

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    newDate.setHours(0, 0, 0, 0);
    if (dateSelectionMode === "start") {
      setSelectedStartDate(newDate); setDateSelectionMode("end");
      if (selectedEndDate && newDate > selectedEndDate) setSelectedEndDate(null);
    } else {
      if (selectedStartDate && newDate < selectedStartDate) {
        setSelectedEndDate(selectedStartDate); setSelectedStartDate(newDate);
      } else { setSelectedEndDate(newDate); }
      setShowCalendar(false); setDateSelectionMode("start");
      toast.success("Date range applied");
    }
  };

  const isDateInRange = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).setHours(0, 0, 0, 0);
    return selectedStartDate && selectedEndDate && date >= selectedStartDate.getTime() && date <= selectedEndDate.getTime();
  };
  const isStartDate = (day) => selectedStartDate && new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() === selectedStartDate.toDateString();
  const isEndDate   = (day) => selectedEndDate   && new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() === selectedEndDate.toDateString();
  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));

  const getDateDisplayText = () => {
    if (selectedStartDate && selectedEndDate) return `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`;
    if (selectedStartDate) return `From ${formatDate(selectedStartDate)}`;
    return "Pick a date range";
  };

  const handleClear = () => {
    setSearchTerm(""); setFilterStatus(""); setFilterHotel("");
    setSelectedStartDate(null); setSelectedEndDate(null); setDateSelectionMode("start");
    loadInvoices(); toast.success("Filters cleared");
  };

  const clearDateFilter = () => { setSelectedStartDate(null); setSelectedEndDate(null); setDateSelectionMode("start"); };

  // ── Unique hotel names for filter dropdown (memoized) ─────────────────────
  const uniqueHotelNames = useMemo(() => [...new Set(invoices.map((inv) => inv.hotelName))], [invoices]);

  if (loading || loadingCountries) {
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
      </div>

      {/* ── Create Invoice ── */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Plus size={16} className="text-[#22c55e]" /> Create New Invoice
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">

          {/* ✅ Country dropdown — from API, no hotels loaded yet */}
          <div className="flex-1 sm:max-w-xs">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Select Country</label>
            <select
              className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 focus:border-[#003d7a] focus:outline-none rounded-lg"
              value={selectedCountry}
              onChange={(e) => handleCountrySelect(e.target.value)}
              disabled={loadingCountries}
            >
              <option value="">Select Country</option>
              {availableCountries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* ✅ Hotel dropdown — only populated after country selected */}
          <div className="flex-1 sm:max-w-md relative hotel-dropdown-container">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Select Hotel / Invoice</label>
            <div
              className={`flex items-center justify-between w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg cursor-pointer hover:border-[#003d7a] transition-colors ${(!selectedCountry || loadingHotels) ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => selectedCountry && !loadingHotels && setIsHotelDropdownOpen(!isHotelDropdownOpen)}
            >
              <span className="truncate text-slate-700">
                {loadingHotels
                  ? "Loading hotels..."
                  : selectedHotelTemplate
                  ? hotels.find((h) => String(h.id) === String(selectedHotelTemplate))?.name
                  : selectedCountry ? "Choose hotel..." : "Select country first..."}
              </span>
              {loadingHotels
                ? <Loader2 size={14} className="animate-spin text-slate-400" />
                : <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isHotelDropdownOpen ? "rotate-180" : ""}`} />}
            </div>

            {isHotelDropdownOpen && !loadingHotels && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search hotel..."
                      className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 focus:border-[#003d7a] focus:ring-1 focus:ring-[#003d7a] rounded-lg outline-none transition-all"
                      onChange={(e) => { setHotelSearchTerm(e.target.value); setActiveHotelIndex(0); }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") { setActiveHotelIndex((prev) => Math.min(prev + 1, filteredHotelsByCountry.length - 1)); e.preventDefault(); }
                        else if (e.key === "ArrowUp") { setActiveHotelIndex((prev) => Math.max(prev - 1, 0)); e.preventDefault(); }
                        else if (e.key === "Enter") {
                          if (filteredHotelsByCountry[activeHotelIndex]) { setSelectedHotelTemplate(filteredHotelsByCountry[activeHotelIndex].id); setIsHotelDropdownOpen(false); setHotelSearchTerm(""); }
                          e.preventDefault();
                        } else if (e.key === "Escape") { setIsHotelDropdownOpen(false); e.preventDefault(); }
                      }}
                      autoFocus onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredHotelsByCountry.length > 0 ? (
                    filteredHotelsByCountry.map((hotel, index) => (
                      <div
                        key={hotel.id}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between group
                          ${String(selectedHotelTemplate) === String(hotel.id) ? "bg-blue-50 text-[#003d7a] font-semibold" : index === activeHotelIndex ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"}`}
                        onMouseEnter={() => setActiveHotelIndex(index)}
                        onClick={() => { setSelectedHotelTemplate(hotel.id); setIsHotelDropdownOpen(false); setHotelSearchTerm(""); }}
                      >
                        <span className="truncate">{hotel.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 group-hover:bg-blue-100 group-hover:text-[#003d7a] px-2 py-0.5 rounded transition-colors uppercase tracking-wider">
                          {hotel.currency}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center bg-white">
                      <Search size={24} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-slate-400 text-xs">No hotels found in {selectedCountry}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-none">
            <button
              onClick={handleCreateInvoice}
              disabled={!selectedHotelTemplate || loadingHotels}
              className="btn btn-sm h-10 bg-[#22c55e] hover:bg-green-600 text-white border-none font-bold shadow-md rounded-lg gap-2 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Plus size={18} /> Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters (UNCHANGED) ── */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px] sm:min-w-[180px]">
            <label className="label pb-1 text-xs font-semibold text-slate-600">Hotel</label>
            <select className="select select-bordered w-full h-10 text-sm bg-white border-slate-300 rounded-lg" value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)}>
              <option value="">All Hotels</option>
              {uniqueHotelNames.map((hotelName, idx) => <option key={idx} value={hotelName}>{hotelName}</option>)}
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
                <button onClick={clearDateFilter} className="btn btn-ghost btn-sm h-10 w-10 min-h-0 p-0"><X size={16} /></button>
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
                  {["S","M","T","W","T","F","S"].map((d, i) => <span key={i} className="text-xs font-bold text-slate-400">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                    const day = i + 1;
                    return (
                      <button key={day} onClick={() => handleDateClick(day)}
                        className={`w-9 h-9 flex items-center justify-center text-sm rounded-full transition-colors ${
                          isStartDate(day) || isEndDate(day) ? "bg-[#003d7a] text-white font-bold"
                          : isDateInRange(day) ? "bg-[#003d7a]/20 text-[#003d7a]"
                          : "hover:bg-[#003d7a] hover:text-white"}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-slate-200">
                  <button onClick={() => { const t=new Date(); t.setHours(0,0,0,0); setSelectedStartDate(t); setSelectedEndDate(t); setShowCalendar(false); toast.success("Today selected"); }} className="btn btn-ghost btn-xs flex-1 text-xs">Today</button>
                  <button onClick={() => { const t=new Date(); const w=new Date(t-7*864e5); w.setHours(0,0,0,0); t.setHours(0,0,0,0); setSelectedStartDate(w); setSelectedEndDate(t); setShowCalendar(false); toast.success("Last 7 days"); }} className="btn btn-ghost btn-xs flex-1 text-xs">7 days</button>
                  <button onClick={() => { const t=new Date(); const m=new Date(t-30*864e5); m.setHours(0,0,0,0); t.setHours(0,0,0,0); setSelectedStartDate(m); setSelectedEndDate(t); setShowCalendar(false); toast.success("Last 30 days"); }} className="btn btn-ghost btn-xs flex-1 text-xs">30 days</button>
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
              {searchLoading ? <><Loader2 size={14} className="animate-spin mr-1" />Searching...</> : "Search"}
            </button>
            <button onClick={handleClear} className="btn btn-sm h-10 btn-ghost bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg px-4 text-sm">Clear</button>
          </div>
        </div>
      </div>

      {/* ── Invoice Table ── */}
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
                {paginatedInvoices.map((inv) => (
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
                        <button onClick={() => handleDownloadPDF(inv)} className="p-1.5 text-slate-400 hover:text-[#003d7a] hover:bg-blue-50 rounded transition-colors" title="Download PDF"><FileText size={16} /></button>
                        <button onClick={() => handleDuplicateInvoice(inv)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Duplicate"><Copy size={16} /></button>
                        <button onClick={() => handleViewInvoice(inv.id)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={() => handleEditInvoice(inv)} className="p-1.5 text-slate-400 hover:text-[#f39c12] hover:bg-amber-50 rounded transition-colors" title="Edit"><Edit2 size={16} /></button>
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

          {/* ── DaisyUI Pagination ── */}
          {totalInvoicePages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Showing {(invoicePage - 1) * INVOICES_PER_PAGE + 1}–{Math.min(invoicePage * INVOICES_PER_PAGE, filteredInvoices.length)} of {filteredInvoices.length}
              </p>
              <div className="join">
                <button className="join-item btn btn-xs" onClick={() => setInvoicePage((p) => Math.max(1, p - 1))} disabled={invoicePage === 1}>«</button>
                {invoicePageNumbers.map((page, idx) =>
                  page === "..." ? (
                    <button key={`ellipsis-${idx}`} className="join-item btn btn-xs btn-disabled">...</button>
                  ) : (
                    <button key={page} className={`join-item btn btn-xs ${invoicePage === page ? "btn-active" : ""}`}
                      style={invoicePage === page ? { backgroundColor: "#002a5c", borderColor: "#002a5c", color: "white" } : {}}
                      onClick={() => setInvoicePage(page)}>
                      {page}
                    </button>
                  )
                )}
                <button className="join-item btn btn-xs" onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))} disabled={invoicePage === totalInvoicePages}>»</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500 px-2">
        <div>Showing {filteredInvoices.length} of {invoices.length} invoices</div>
        <div className="flex gap-4">
          <span>Pending: {invoices.filter((i) => i.status === "pending").length}</span>
          <span>Ready: {invoices.filter((i) => i.status === "ready").length}</span>
        </div>
      </div>

      {/* ── Delete Modal (UNCHANGED) ── */}
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