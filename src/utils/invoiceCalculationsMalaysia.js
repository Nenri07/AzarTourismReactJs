export const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL CONFIGS (MALAYSIA)
// ─────────────────────────────────────────────────────────────────────────────

export const HOTEL_CONFIGS = {
  // ── 1. Lanson Place ────────────────────────────────────────────────────────
  LANSON_PLACE: {
    detect: (name) => name.includes('lanson place'),
    columns: ['Date', 'Description', 'Amount'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => {
      const nightlyTotalMyr = usdAmount * exchangeRate;
      const nightlyTtx = 10.00; // Fixed RM 10 per night Tourism Tax
      const remainingAmount = nightlyTotalMyr - nightlyTtx;
      
      const nightlyRoomPackage = remainingAmount / 1.08;
      const nightlySst = nightlyRoomPackage * 0.08;

      return {
        nightlyTotalMyr: parseNum(nightlyTotalMyr),
        nightlyTtx: parseNum(nightlyTtx),
        nightlyRoomPackage: parseNum(nightlyRoomPackage),
        nightlySst: parseNum(nightlySst)
      };
    },
    // Lanson Place requires 3 separate rows per night in the table
    buildRows: ({ date, nightlyRoomPackage, nightlySst, nightlyTtx }) => {
      return [
        { date, description: 'Room Package', amount: parseNum(nightlyRoomPackage) },
        { date, description: 'Room - SST', amount: parseNum(nightlySst) },
        { date, description: 'Tourism Tax', amount: parseNum(nightlyTtx) }
      ];
    }
  },

  OASIA: {
    detect: (name) => name.includes('Oasia'),
    columns: ['Date', 'Description', 'Amount'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => {
      // Standard calculation: same math as Lanson Place, but generic fallback
      const nightlyTotalMyr = usdAmount * exchangeRate;
      const nightlyTtx = 10.00;
      const remainingAmount = nightlyTotalMyr - nightlyTtx;
      
      const nightlyRoomPackage = remainingAmount / 1.08;
      const nightlySst = nightlyRoomPackage * 0.08;

      return {
        nightlyTotalMyr: parseNum(nightlyTotalMyr),
        nightlyTtx: parseNum(nightlyTtx),
        nightlyRoomPackage: parseNum(nightlyRoomPackage),
        nightlySst: parseNum(nightlySst)
      };
    },
    // Other hotels might combine it into one row, or show it standard
      buildRows: ({ date, nightlyRoomPackage}) => {
      return [
        { date, description: 'Room Package', amount: parseNum(nightlyRoomPackage) },
      ];
    }
  },

  //////Grand Hayyat

  GRAND_HYATT: {
    detect: (name) => name.toLowerCase().includes('grand hyatt'),
    columns: ['DATE / TARIKH', 'DESCRIPTION / DESKRIPSI', 'REFERENCE / RUJUKAN', 'DEBIT / DEBIT', 'CREDIT / KREDIT'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => {
      const nightlyTotalMyr = usdAmount * exchangeRate;
      const nightlyTtx = 10.00; // Fixed RM 10 per night Tourism Tax
      const remainingAmount = nightlyTotalMyr - nightlyTtx;
      
      const nightlyRoomPackage = remainingAmount / 1.08;
      const nightlySst = nightlyRoomPackage * 0.08;

      return {
        nightlyTotalMyr: parseNum(nightlyTotalMyr),
        nightlyTtx: parseNum(nightlyTtx),
        nightlyRoomPackage: parseNum(nightlyRoomPackage),
        nightlySst: parseNum(nightlySst)
      };
    },
    // The Grand Hyatt React component expects one object per night with the breakdown fields.
    // It will automatically split this into the 3 required rows on the frontend.
    buildRows: ({ date, nightlyRoomPackage, nightlySst, nightlyTtx }) => {
      return [
        { 
          date, 
          description: 'Accommodation', 
          baseRate: parseNum(nightlyRoomPackage),
          serviceCharge: parseNum(nightlySst),
          tourismTax: parseNum(nightlyTtx)
        }
      ];
    }
  },

  // ── FALLBACK: Other Malaysian Hotels ───────────────────────────────────────
  OTHER_MALAYSIA: {
    detect: () => true,
    columns: ['Date', 'Description', 'Amount'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => {
      // Standard calculation: same math as Lanson Place, but generic fallback
      const nightlyTotalMyr = usdAmount * exchangeRate;
      const nightlyTtx = 10.00;
      const remainingAmount = nightlyTotalMyr - nightlyTtx;
      
      const nightlyRoomPackage = remainingAmount / 1.08;
      const nightlySst = nightlyRoomPackage * 0.08;

      return {
        nightlyTotalMyr: parseNum(nightlyTotalMyr),
        nightlyTtx: parseNum(nightlyTtx),
        nightlyRoomPackage: parseNum(nightlyRoomPackage),
        nightlySst: parseNum(nightlySst)
      };
    },
    // Other hotels might combine it into one row, or show it standard
    buildRows: ({ date, nightlyTotalMyr }) => {
      return [
        { date, description: 'Room Charge (Incl. SST & TTX)', amount: parseNum(nightlyTotalMyr) }
      ];
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECT HOTEL TYPE
// ─────────────────────────────────────────────────────────────────────────────

export const detectHotelType = (hotelConfig) => {
  const name = hotelConfig?.hotel_name?.toLowerCase() || '';
  const match = Object.entries(HOTEL_CONFIGS).find(
    ([key, cfg]) => key !== 'OTHER_MALAYSIA' && cfg.detect(name)
  );
  return match ? match[0] : 'OTHER_MALAYSIA';
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOMMODATION CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export const calculateAccommodation = (formData, hotelType) => {
  const acc = formData.accommodation_details || {};

  const usdAmount = parseFloat(acc.usd_amount || acc.dollar_amount || 0);
  const exchangeRate = parseFloat(acc.exchange_rate || 0);
  const totalNights = parseInt(acc.total_nights) || 0;

  if (usdAmount === 0 || exchangeRate === 0 || totalNights === 0) {
    return {
      usdAmount: 0, exchangeRate: 0, totalNights: 0,
      nightlyTotalMyr: 0, nightlyTtx: 0, nightlyRoomPackage: 0, nightlySst: 0,
      totalRoomAllNightsMyr: 0
    };
  }

  const hotelCfg = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_MALAYSIA;
  const rates = hotelCfg.calculateNightlyRate({ usdAmount, exchangeRate });

  return {
    usdAmount,
    exchangeRate,
    totalNights,
    ...rates,
    totalRoomAllNightsMyr: parseNum(rates.nightlyTotalMyr * totalNights),
    // Use the 'rates' object which contains the calculated values
    roombaseAmount: parseNum(rates.nightlyRoomPackage),
    tourismTax: parseNum(rates.nightlyTtx),
    roomSST: parseNum(rates.nightlySst),
    totalNightGrossMyr: parseNum(rates.nightlyTotalMyr),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES CALCULATION (e.g., Laundry)
// ─────────────────────────────────────────────────────────────────────────────

export const calculateServices = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return { services: [], totalServicesGrossMyr: 0 };
  }

  const totalServicesGrossMyr = services.reduce((sum, service) => {
    return sum + parseFloat(service.gross_amount || 0);
  }, 0);

  return { services, totalServicesGrossMyr };
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY (MALAYSIA)
// ─────────────────────────────────────────────────────────────────────────────

export const calculateFinalSummary = (formData, hotelType) => {
  const accCalc = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);

  // 1. Total MYR including rooms AND all extra services (Combined Gross)
  const grandTotalMyr = accCalc.totalRoomAllNightsMyr + servicesCalc.totalServicesGrossMyr;

  // 2. Break down the Totals based on the COMBINED gross
  const totalTtx = parseNum(accCalc.totalNights * 10.00);
  
  // Subtract Tourism Tax from the Combined Gross first
  const totalExcludingTtx = grandTotalMyr - totalTtx;
  
  // Divide by 1.08 to get the Base Taxable Amount
  const totalTaxableBase = parseNum(totalExcludingTtx / 1.08);
  
  // Multiply by 0.08 to get the SST
  const totalSst = parseNum(totalTaxableBase * 0.08);

  // 3. Convert final MYR grand total back to USD
  let balanceUsd = 0;
  if (accCalc.exchangeRate > 0) {
    balanceUsd = grandTotalMyr / accCalc.exchangeRate;
  }

  return {
    total_taxable_amount: totalTaxableBase,     // Base amount before SST (Includes Services)
    total_sst_8: totalSst,                      // 8% SST calculated on combined base
    total_ttx: totalTtx,                        // Total Tourism Tax
    grand_total_myr: parseNum(grandTotalMyr),   // Total MYR (Rooms + Services)
    balance_usd: parseNum(balanceUsd),          // Grand Total MYR / Exchange Rate
    grand_total: parseNum(grandTotalMyr),       // Alias for UI fallback
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP TO BACKEND SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const mapToBackendSchema = (formData, hotelConfig) => {
  const hotelType = detectHotelType(hotelConfig);
  const hotelCfg = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_MALAYSIA;
  const accCalc = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);
  const summary = calculateFinalSummary(formData, hotelType);

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    return dateStr.split('T')[0];
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ').split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Build rows dynamically based on the hotel's configuration
  const accommodationDetailsArray = [];
  const arrivalDate = new Date(formData.arrival_date);

  for (let i = 0; i < accCalc.totalNights; i++) {
    const currentDate = new Date(arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    const rowsForNight = hotelCfg.buildRows({
      date: dateStr,
      nightlyTotalMyr: accCalc.nightlyTotalMyr,
      nightlyRoomPackage: accCalc.nightlyRoomPackage,
      nightlySst: accCalc.nightlySst,
      nightlyTtx: accCalc.nightlyTtx
    });

    rowsForNight.forEach(row => {
      accommodationDetailsArray.push({ day: i + 1, ...row });
    });
  }

  const otherServicesArray = servicesCalc.services.map(service => ({
    description: capitalizeWords(service.description) || 'Service',
    amount: parseFloat(service.gross_amount || 0),
    date: formatDate(service.service_date || formData.invoice_date),
  }));

  return {
    data: {
      // Configuration & Routing
      hotel: formData.hotel_name || '',
      hotelType,
      tableColumns: hotelCfg.columns,
      referenceNo: formData.reference_no || '',

      // 1. Hotel / Property Information
      companyRegNo: formData.company_reg_no || '',
      sstRegNo: formData.sst_reg_no || '',
      ttxRegNo: formData.ttx_reg_no || '',
      tinNo: formData.tin_no || '',
      hotelAddress: formData.hotel_address || '',
      hotelPhone: formData.hotel_phone || '',
      hotelFax: formData.hotel_fax || '',
      hotelEmail: formData.hotel_email || '',

      // 2. Guest & Client Information
      guestName: capitalizeWords(formData.guest_name) || 'Guest',
      companyName:  'Azar Tourism Services',
      address:  'Algeria Square Building Number 12 First Floor,Tripoli, Libya. ',
      nationality: capitalizeWords(formData.nationality) || '',
      guestPhone: formData.guest_phone || '',
      guestEmail: formData.guest_email || '',
      membershipNo: formData.membership_no || '',
      paxAdult: formData.adults || 1,
      paxChild: formData.children || 0,
      accountContact: formData.account_contact || '',

      // 3. Stay & Reservation Details
      roomNo: formData.room_number || '',
      roomType: formData.room_type || '',
      arrivalDate: formatDate(formData.arrival_date),
      departureDate: formatDate(formData.departure_date),
      confNo: formData.conf_no || '',
      groupCode: formData.group_code || '',
      crsNo: formData.crs_no || '',

      // 4. Invoice Metadata
      invoiceNo: formData.invoice_no || '',
      folioNo: formData.folio_no || '',
      arNumber: formData.ar_number || '',
      poNo: formData.po_no || '',
      thirdPartyNo: formData.third_party_no || '',
      vesselName: formData.vessel_name || '',
      bookerName: capitalizeWords(formData.booker_name) || '',
      invoiceDate: formatDate(formData.invoice_date),
      invoiceTime: formData.invoice_time || '',
      cashierId: formData.cashier_id || '',
      cashierName: capitalizeWords(formData.cashier_name) || '',
      uuid: formData.uuid || '',

      // 5. Bank & Payment Details
      bankName: formData.bank_name || '',
      accountNumber: formData.account_number || '',
      bankCode: formData.bank_code || '',
      branchCode: formData.branch_code || '',
      swiftCode: formData.swift_code || '',
      accountHolder: formData.account_holder || '',
      bankAddress: formData.bank_address || '',

      // 6. Status & System
      status: formData.status || 'pending',
      note: formData.note || '',
      currency: formData.currency || 'MYR',

      // 7. Math & Accommodation Data
      nights: accCalc.totalNights,
      usdAmount: parseNum(accCalc.usdAmount),
      exchangeRate: parseNum(accCalc.exchangeRate, 7),
      
      // 8. Breakdown Totals
      totalRoomGrossMyr: parseNum(accCalc.totalRoomAllNightsMyr),
      totalServicesGrossMyr: parseNum(servicesCalc.totalServicesGrossMyr),
      baseTaxableAmount: summary.total_taxable_amount,
      totalSst8Percent: summary.total_sst_8,
      totalTourismTax: summary.total_ttx,
      grandTotalMyr: summary.grand_total_myr,
      balanceUsd: summary.balance_usd,
      roombaseAmount: parseNum(accCalc.nightlyRoomPackage),
      tourismTax: parseNum(accCalc.nightlyTtx),
      roomSST: parseNum(accCalc.nightlySst),
      totalNightGrossMyr: parseNum(accCalc.nightlyTotalMyr),

      // 9. Tables
      accommodationDetails: accommodationDetailsArray,
      otherServices: otherServicesArray,
    },
  };
};