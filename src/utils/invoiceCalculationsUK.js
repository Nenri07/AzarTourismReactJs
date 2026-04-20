// ─────────────────────────────────────────────────────────────────────────────
// UK INVOICE CALCULATIONS
// Logic: Room charge / 1.2 = Net (excl. VAT), Net * 0.2 = VAT, Net + VAT = Total
// ─────────────────────────────────────────────────────────────────────────────

export const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL CONFIGS (UK)
// Each hotel defines its table columns, row-building strategy, and VAT logic.
// ─────────────────────────────────────────────────────────────────────────────

export const UK_HOTEL_CONFIGS = {

  // ── 1. Hilton London Metropole ─────────────────────────────────────────────
  HILTON_METROPOLE: {
    detect: (name) => name.toLowerCase().includes('metropole'),
    columns: ['DATE', 'DESCRIPTION', 'ID', 'REF NO', 'GUEST CHARGES', 'CREDIT', 'BALANCE'],
    showVatBreakdownInRows: false, // Shows gross in table, VAT summary at bottom
    buildRows: ({ date, description, grossAmount, refId, refNo, credit }) => [
      {
        date,
        description,
        id: refId,
        ref_no: refNo,
        guest_charges: credit ? null : parseNum(grossAmount),
        credit: credit ? parseNum(credit) : null,
        balance: null,
      },
    ],
  },

  // ── 2. Hilton Park Lane ────────────────────────────────────────────────────
  HILTON_PARK_LANE: {
    detect: (name) => name.toLowerCase().includes('park lane') && name.toLowerCase().includes('hilton'),
    columns: ['DATE', 'DESCRIPTION', 'ID', 'REF NO', 'GUEST CHARGES', 'CREDIT', 'BALANCE'],
    showVatBreakdownInRows: false,
    buildRows: ({ date, description, grossAmount, refId, refNo, credit }) => [
      {
        date,
        description,
        id: refId,
        ref_no: refNo,
        guest_charges: credit ? null : parseNum(grossAmount),
        credit: credit ? parseNum(credit) : null,
        balance: null,
      },
    ],
  },

  // ── 3. Four Seasons Park Lane ──────────────────────────────────────────────
  FOUR_SEASONS: {
    detect: (name) => name.toLowerCase().includes('four seasons'),
    columns: ['Date', 'Description', 'Reference', 'Debit £', 'Credit £'],
    showVatBreakdownInRows: false,
    buildRows: ({ date, description, grossAmount, refNo, credit }) => [
      {
        date,
        description,
        reference: refNo || '',
        debit: credit ? null : parseNum(grossAmount),
        credit: credit ? parseNum(credit) : null,
      },
    ],
  },

  // ── 4. Park Plaza ──────────────────────────────────────────────────────────
  PARK_PLAZA: {
    detect: (name) => name.toLowerCase().includes('park plaza'),
    columns: ['Date', 'Text', 'Charges Excl. VAT', 'VAT Amount', 'Charges (GBP)', 'Credits (GBP)'],
    showVatBreakdownInRows: true, // Shows Net + VAT breakdown per row
    buildRows: ({ date, description, grossAmount, netAmount, vatAmount, credit }) => [
      {
        date,
        text: description,
        charges_excl_vat: credit ? null : parseNum(netAmount),
        vat_amount: credit ? null : parseNum(vatAmount),
        charges_gbp: credit ? null : parseNum(grossAmount),
        credits_gbp: credit ? parseNum(credit) : null,
      },
    ],
  },

  // ── 5. Marriott Park Lane ──────────────────────────────────────────────────
  MARRIOTT: {
    detect: (name) => name.toLowerCase().includes('marriott'),
    columns: ['Date', 'Text', 'Charges GBP', 'Credits GBP'],
    showVatBreakdownInRows: false,
    buildRows: ({ date, description, grossAmount, credit }) => [
      {
        date,
        text: description,
        charges_gbp: credit ? null : parseNum(grossAmount),
        credits_gbp: credit ? parseNum(credit) : null,
      },
    ],
  },

  // ── 6. Mandarin Oriental ──────────────────────────────────────────────────
  MANDARIN_ORIENTAL: {
    detect: (name) => name.toLowerCase().includes('mandarin'),
    columns: ['Date', 'Description', 'Net', 'VAT Amount', 'Total'],
    showVatBreakdownInRows: true,
    buildRows: ({ date, description, grossAmount, netAmount, vatAmount, credit }) => [
      {
        date,
        description,
        net: credit ? null : parseNum(netAmount),
        vat_amount: credit ? null : parseNum(vatAmount),
        total: credit ? `(${parseNum(Math.abs(credit)).toFixed(2)})` : parseNum(grossAmount),
        is_credit: !!credit,
      },
    ],
  },

  // ── 7. Hyatt Regency Churchill ─────────────────────────────────────────────
  HYATT_REGENCY: {
    detect: (name) => name.toLowerCase().includes('hyatt'),
    columns: ['DATE', 'DESCRIPTION', 'REFERENCE', 'DEBIT', 'CREDIT'],
    showVatBreakdownInRows: false,
    buildRows: ({ date, description, grossAmount, reference, credit }) => [
      {
        date,
        description,
        reference: reference || '',
        debit: credit ? null : parseNum(grossAmount),
        credit: credit ? parseNum(credit) : null,
      },
    ],
  },

  // ── FALLBACK ───────────────────────────────────────────────────────────────
  OTHER_UK: {
    detect: () => true,
    columns: ['Date', 'Description', 'Reference', 'Charges (GBP)', 'Credits (GBP)'],
    showVatBreakdownInRows: false,
    buildRows: ({ date, description, grossAmount, refNo, credit }) => [
      {
        date,
        description,
        reference: refNo || '',
        charges: credit ? null : parseNum(grossAmount),
        credits: credit ? parseNum(credit) : null,
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECT HOTEL TYPE
// ─────────────────────────────────────────────────────────────────────────────

export const detectUKHotelType = (hotelConfig) => {
  const name = hotelConfig?.hotel_name?.toLowerCase() || '';
  const match = Object.entries(UK_HOTEL_CONFIGS).find(
    ([key, cfg]) => key !== 'OTHER_UK' && cfg.detect(name)
  );
  return match ? match[0] : 'OTHER_UK';
};

// ─────────────────────────────────────────────────────────────────────────────
// CORE VAT CALCULATION
// grossAmount / 1.2 = net, net * 0.2 = vat, net + vat = gross
// ─────────────────────────────────────────────────────────────────────────────

export const calcVAT = (grossAmount) => {
  const gross = parseNum(grossAmount);
  const net = parseNum(gross / 1.2);
  const vat = parseNum(net * 0.2);
  return { gross, net, vat };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOMMODATION CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export const calculateUKAccommodation = (formData) => {
  const acc = formData.accommodation_details || {};
  const gbpAmount = parseFloat(acc.gbp_amount || acc.room_rate || 0);
  const totalNights = parseInt(acc.total_nights) || 0;

  if (gbpAmount === 0 || totalNights === 0) {
    return {
      gbpAmount: 0, totalNights: 0,
      nightlyGross: 0, nightlyNet: 0, nightlyVat: 0,
      totalRoomGross: 0, totalRoomNet: 0, totalRoomVat: 0,
    };
  }

  const { gross: nightlyGross, net: nightlyNet, vat: nightlyVat } = calcVAT(gbpAmount);

  return {
    gbpAmount,
    totalNights,
    nightlyGross,
    nightlyNet,
    nightlyVat,
    totalRoomGross: parseNum(nightlyGross * totalNights),
    totalRoomNet: parseNum(nightlyNet * totalNights),
    totalRoomVat: parseNum(nightlyVat * totalNights),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES CALCULATION
// Each service has its own gross amount → break into net + vat
// ─────────────────────────────────────────────────────────────────────────────

export const calculateUKServices = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return { services: [], totalServicesGross: 0, totalServicesNet: 0, totalServicesVat: 0 };
  }

  let totalServicesGross = 0;
  let totalServicesNet = 0;
  let totalServicesVat = 0;

  const enriched = services.map((service) => {
    const gross = parseFloat(service.gross_amount || 0);
    const { net, vat } = calcVAT(gross);
    totalServicesGross += gross;
    totalServicesNet += net;
    totalServicesVat += vat;
    return { ...service, net_amount: parseNum(net), vat_amount: parseNum(vat) };
  });

  return {
    services: enriched,
    totalServicesGross: parseNum(totalServicesGross),
    totalServicesNet: parseNum(totalServicesNet),
    totalServicesVat: parseNum(totalServicesVat),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export const calculateUKFinalSummary = (formData) => {
  const accCalc = calculateUKAccommodation(formData);
  const servicesCalc = calculateUKServices(formData.other_services);

  const totalNetExclVat = parseNum(accCalc.totalRoomNet + servicesCalc.totalServicesNet);
  const totalVat20 = parseNum(accCalc.totalRoomVat + servicesCalc.totalServicesVat);
  const grandTotalGbp = parseNum(accCalc.totalRoomGross + servicesCalc.totalServicesGross);

  return {
    total_net_excl_vat: totalNetExclVat,   // Taxable Amount (excl VAT)
    total_vat_20: totalVat20,               // VAT at 20%
    zero_rated: 0,
    non_taxable: 0,
    grand_total_gbp: grandTotalGbp,         // Total Amount Payable
    grand_total: grandTotalGbp,             // Alias
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP TO BACKEND SCHEMA (UK)
// ─────────────────────────────────────────────────────────────────────────────

export const mapToUKBackendSchema = (formData, hotelConfig) => {
  const hotelType = detectUKHotelType(hotelConfig);
  const hotelCfg = UK_HOTEL_CONFIGS[hotelType] || UK_HOTEL_CONFIGS.OTHER_UK;
  const accCalc = calculateUKAccommodation(formData);
  const servicesCalc = calculateUKServices(formData.other_services);
  const summary = calculateUKFinalSummary(formData);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ').split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Generate Hilton-style IDs
  const accommodationRefId = formData.accommodation_ref_id ||
    [...Array(5)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');
  const servicesRefId = formData.services_ref_id ||
    [...Array(5)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');
  const startingRefNo = formData.starting_ref_no ||
    Math.floor(10000000 + Math.random() * 90000000);

  // Build accommodation rows
  const accommodationDetailsArray = [];
  const arrivalDate = formData.arrival_date ? new Date(formData.arrival_date) : new Date();
  const roomDescription = formData.room_description || hotelCfg.defaultRoomDescription || 'GUEST ROOM';

  for (let i = 0; i < accCalc.totalNights; i++) {
    const currentDate = new Date(arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const refNo = String(Number(startingRefNo) + i);
    const { net, vat } = calcVAT(accCalc.gbpAmount);

    const rows = hotelCfg.buildRows({
      date: dateStr,
      description: roomDescription,
      grossAmount: accCalc.nightlyGross,
      netAmount: net,
      vatAmount: vat,
      refId: accommodationRefId,
      refNo,
      reference: formData.reference_no || '',
    });

    rows.forEach((row) => accommodationDetailsArray.push({ day: i + 1, ...row }));
  }

  // Build services rows
  const otherServicesArray = servicesCalc.services.map((service, idx) => {
    const refNo = String(Number(startingRefNo) + accCalc.totalNights + idx);
    const rows = hotelCfg.buildRows({
      date: formatDate(service.service_date || formData.invoice_date),
      description: capitalizeWords(service.service_name) || capitalizeWords(service.description) || 'Service',
      grossAmount: parseFloat(service.gross_amount || 0),
      netAmount: service.net_amount,
      vatAmount: service.vat_amount,
      refId: servicesRefId,
      refNo,
      reference: formData.reference_no || '',
    });
    return { ...rows[0], service_type: service.service_name };
  });

  return {
    data: {
      // Config & Routing
      hotel: formData.hotel_name || '',
      hotelType,
      tableColumns: hotelCfg.columns,
      showVatBreakdownInRows: hotelCfg.showVatBreakdownInRows,
      referenceNo: formData.reference_no || '',

      // Hotel / Property Information
      hotelAddress: formData.hotel_address || '',
      hotelPhone: formData.hotel_phone || '',
      hotelFax: formData.hotel_fax || '',
      hotelEmail: formData.hotel_email || '',
      vatNo: formData.vat_no || '',
      companyRegNo: formData.company_reg_no || '',

      // Guest & Client Information
      guestName: capitalizeWords(formData.guest_name) || 'Guest',
      companyName: 'Azar Tourism Services',
      address: 'Algeria Square Building Number 12 First Floor, Tripoli, Libya',
      nationality: capitalizeWords(formData.nationality) || '',
      guestPhone: formData.guest_phone || '',
      guestEmail: formData.guest_email || '',
      honorsNo: formData.honors_no || '',
      adults: formData.adults || 1,
      children: formData.children || 0,

      // Stay & Reservation Details
      roomNo: formData.room_number || '',
      roomType: formData.room_type || '',
      arrivalDate: formatDate(formData.arrival_date),
      arrivalTime: formData.arrival_time || '',
      departureDate: formatDate(formData.departure_date),
      departureTime: formData.departure_time || '',
      ratePlan: formData.rate_plan || '',
      confNo: formData.conf_no || '',
      reservationNo: formData.reservation_no || '',
      groupCode: formData.group_code || '',

      // Invoice Metadata
      vatInvoiceNo: formData.vat_invoice_no || '',
      invoiceNo: formData.invoice_no || '',
      folioNo: formData.folio_no || '',
      invoiceDate: formatDate(formData.invoice_date),
      invoiceTime: formData.invoice_time || '',
      cashierId: formData.cashier_id || '',
      cashierName: capitalizeWords(formData.cashier_name) || '',
      taxDate: formatDate(formData.tax_date || formData.invoice_date),
      pageNo: formData.page_no || '1',

      // Bank & Payment Details
      bankName: formData.bank_name || '',
      accountNumber: formData.account_number || '',
      sortCode: formData.sort_code || '',
      swiftCode: formData.swift_code || '',
      ibanCode: formData.iban_code || '',
      accountHolder: formData.account_holder || '',

      // Status
      status: formData.status || 'pending',
      note: formData.note || '',
      currency: 'GBP',

      // Reference IDs (Hilton-style)
      accommodationRefId,
      servicesRefId,
      startingRefNo,

      // Math & Accommodation
      nights: accCalc.totalNights,
      gbpAmount: parseNum(accCalc.gbpAmount),
      nightlyGross: parseNum(accCalc.nightlyGross),
      nightlyNet: parseNum(accCalc.nightlyNet),
      nightlyVat: parseNum(accCalc.nightlyVat),
      totalRoomGross: parseNum(accCalc.totalRoomGross),
      totalRoomNet: parseNum(accCalc.totalRoomNet),
      totalRoomVat: parseNum(accCalc.totalRoomVat),

      // Services Math
      totalServicesGross: parseNum(servicesCalc.totalServicesGross),
      totalServicesNet: parseNum(servicesCalc.totalServicesNet),
      totalServicesVat: parseNum(servicesCalc.totalServicesVat),

      // Summary
      taxableAmountExclVat: summary.total_net_excl_vat,
      zeroRatedAmount: summary.zero_rated,
      vatAt20Percent: summary.total_vat_20,
      nonTaxableAmount: summary.non_taxable,
      totalAmountPayable: summary.grand_total_gbp,

      // Tables
      accommodationDetails: accommodationDetailsArray,
      otherServices: otherServicesArray,
    },
  };
};