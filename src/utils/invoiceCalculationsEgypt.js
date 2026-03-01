
export const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL CONFIGS
// To add a new hotel: add one entry here. Zero changes anywhere else.
// ─────────────────────────────────────────────────────────────────────────────

export const HOTEL_CONFIGS = {

  // ── 1. STAYBRIDGE ──────────────────────────────────────────────────────────
  // Row formula : roomEGP = USD / exchangeRate   (rate is inverse: 1 EGP = x USD)
  // Balance USD : grandTotal × exchangeRate
  // Verified    : 550 / 0.0200145 = 27,480.08 ✓
  //               388,450.12 × 0.0200145 = 7,774.63 USD ✓
  STAY_BRIDGE: {
    detect: (name) => name.includes('staybridge'),
    columns: ['date', 'text', 'exchangeRateCol', 'chargesEgp', 'creditsEgp'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount / exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp, usdAmount, exchangeRate }) => ({
      date,
      description:      'Accommodation',
      text:             'Accommodation',
      exchangeRateCol:  `${usdAmount} USD / ${exchangeRate}`,
      rate:             parseNum(roomAmountEgp),
      baseRate:         0,
      serviceCharge:    0,
      cityTax:          0,
      vat:              0,
      chargesEgp:       parseNum(roomAmountEgp),
      creditsEgp:       0,
    }),
    balanceDirection: 'multiply', // grandTotal × exchangeRate
  },

  // ── 2. RADISSON ────────────────────────────────────────────────────────────
  // Exact flat-tax calculation — DO NOT CHANGE
  // a = USD × rate  (base EGP)
  // b = a × 0.12    (12% SC)
  // c = (a+b) × 0.01  (1% City Tax)
  // d = (a+b+c) × 0.14  (14% VAT)
  // e = a+b+c+d  (nightly gross)
  // One object per night — PDF template renders the 4 visual sub-rows
  // Verified: Net 134,032.11, SC 16,082.02, VAT 18,762.94, City Tax 1,340.46 ✓
  RADISSON: {
    detect: (name) => name.includes('radisson'),
    columns: ['date', 'description', 'baseRate', 'serviceCharge', 'cityTax', 'vat', 'rate'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => {
      const realCal= usdAmount * exchangeRate;
      const withDiv= realCal/1.289568;
      const a =   withDiv         // Base EGP
      const b = a * 0.12;                           // 12% SC

      const includingprev = a + b;
      const c = includingprev * 0.01;               // 1% City Tax
      const includingprev2 = c + includingprev;
      const d = includingprev2 * 0.14;              // 14% VAT
      const e = a + b + c + d;                      // Nightly Gross

      return {
        roomAmountEgp: e,
        breakdown: { a, b, c, d, e },
      };
    },
    buildRow: ({ date, breakdown }) => ({
      date,
      description:   'Accommodation',
      baseRate:      parseNum(breakdown.a),
      serviceCharge: parseNum(breakdown.b),
      cityTax:       parseNum(breakdown.c),
      vat:           parseNum(breakdown.d),
      rate:          parseNum(breakdown.e),
      chargesEgp:    parseNum(breakdown.e),
      creditsEgp:    0,
    }),
    balanceDirection: 'divide',
  },

  // ── 3. HILTON ──────────────────────────────────────────────────────────────
  // Row formula : roomEGP = USD × exchangeRate
  // Balance USD : grandTotal / exchangeRate
  // Verified    : 500 × 47.26 = 23,630 ✓
  //               496,230 / 47.26 = 10,500 USD ✓
  // Table cols  : Date, Description, Rate, Exchange Rate, ID, RefNo, GuestCharge, Credit
  HILTON: {
    detect: (name) => name.includes('hilton'),
    columns: ['date', 'description', 'rateLabel', 'exchangeRateCol', 'refNo', 'chargesEgp', 'creditsEgp'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount * exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp, usdAmount, exchangeRate }) => ({
      date,
      description:     'ACCOMMODATION',
      rateLabel:       `${usdAmount}.00 USD * ${exchangeRate}`,
      exchangeRateCol: exchangeRate,
      refNo:           '',
      rate:            parseNum(roomAmountEgp),
      baseRate:        0,
      serviceCharge:   0,
      cityTax:         0,
      vat:             0,
      chargesEgp:      parseNum(roomAmountEgp),
      creditsEgp:      0,
    }),
    balanceDirection: 'divide',
  },

  // ── 4. FAIRMONT ────────────────────────────────────────────────────────────
  // Row formula : roomEGP = USD × exchangeRate
  // Balance USD : grandTotal / exchangeRate
  // Verified    : 480 × 50.30 = 24,144 ✓
  //               170,668.89 / 50.30 = 3,393 USD ✓
  // Description : "Accommodation on BB basis"
  // Extra cols  : chargesUSD, creditsUSD
  FAIRMONT: {
    detect: (name) => name.includes('fairmont'),
    columns: ['date', 'description', 'chargesEgp', 'creditsEgp', 'chargesUsd', 'creditsUsd'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount * exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp, usdAmount }) => ({
      date,
      description:   'Accommodation on BB basis',
      rate:          parseNum(roomAmountEgp),
      baseRate:      0,
      serviceCharge: 0,
      cityTax:       0,
      vat:           0,
      chargesEgp:    parseNum(roomAmountEgp),
      creditsEgp:    0,
      chargesUsd:    parseNum(usdAmount),
      creditsUsd:    0,
    }),
    balanceDirection: 'divide',
  },

  // ── 5. INTERCONTINENTAL ────────────────────────────────────────────────────
  // Row formula : roomEGP = USD × exchangeRate
  // Balance USD : grandTotal / exchangeRate
  // Table cols  : Date, Description, Charges EGP, Credits EGP
  INTERCONTINENTAL: {
    detect: (name) => name.includes('intercontinental'),
    columns: ['date', 'description', 'chargesEgp', 'creditsEgp'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount * exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp }) => ({
      date,
      description:   'Accommodation',
      rate:          parseNum(roomAmountEgp),
      baseRate:      0,
      serviceCharge: 0,
      cityTax:       0,
      vat:           0,
      chargesEgp:    parseNum(roomAmountEgp),
      creditsEgp:    0,
    }),
    balanceDirection: 'divide',
  },

  // ── 6. HOLIDAY INN ─────────────────────────────────────────────────────────
  // Row formula : roomEGP = USD × exchangeRate
  // Balance USD : grandTotal / exchangeRate
  // Table cols  : Date, Description, Charges, Credits
  HOLIDAY_INN: {
    detect: (name) => name.includes('holiday inn') || name.includes('holidayinn') || name.includes('holiday-inn'),
    columns: ['date', 'description', 'chargesEgp', 'creditsEgp'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount * exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp }) => ({
      date,
      description:   'Accommodation',
      rate:          parseNum(roomAmountEgp),
      baseRate:      0,
      serviceCharge: 0,
      cityTax:       0,
      vat:           0,
      chargesEgp:    parseNum(roomAmountEgp),
      creditsEgp:    0,
    }),
    balanceDirection: 'divide',
  },

  // ── 7. TOLIP ───────────────────────────────────────────────────────────────
  // Row formula : roomEGP = USD / exchangeRate  (same inverse rate as Staybridge)
  // Balance USD : grandTotal × exchangeRate
  // Verified    : 450 / 0.019869 = 22,648.35 ✓
  //               541,798.85 × 0.019869 = 10,765 USD ✓
  // Table cols  : Date, Text, Debit EGP, Credit EGP
  TOLIP: {
    detect: (name) => name.includes('tolip'),
    columns: ['date', 'text', 'exchangeRateCol', 'debitEgp', 'creditEgp'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount / exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp, usdAmount, exchangeRate }) => ({
      date,
      description:     'Accommodation',
      text:            'Accommodation',
      exchangeRateCol: `${usdAmount} USD / ${exchangeRate}`,
      rate:            parseNum(roomAmountEgp),
      baseRate:        0,
      serviceCharge:   0,
      cityTax:         0,
      vat:             0,
      debitEgp:        parseNum(roomAmountEgp),
      creditEgp:       0,
    }),
    balanceDirection: 'multiply', // grandTotal × exchangeRate
  },

  // ── FALLBACK ───────────────────────────────────────────────────────────────
  OTHER_EGYPT: {
    detect: () => true,
    columns: ['date', 'description', 'chargesEgp', 'creditsEgp'],
    calculateNightlyRate: ({ usdAmount, exchangeRate }) => ({
      roomAmountEgp: usdAmount * exchangeRate,
      breakdown: null,
    }),
    buildRow: ({ date, roomAmountEgp }) => ({
      date,
      description:   'Accommodation',
      rate:          parseNum(roomAmountEgp),
      baseRate:      0,
      serviceCharge: 0,
      cityTax:       0,
      vat:           0,
      chargesEgp:    parseNum(roomAmountEgp),
      creditsEgp:    0,
    }),
    balanceDirection: 'divide',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECT HOTEL TYPE
// Checks in order — first match wins. OTHER_EGYPT is always the fallback.
// ─────────────────────────────────────────────────────────────────────────────

export const detectHotelType = (hotelConfig) => {
  const name = hotelConfig?.hotel_name?.toLowerCase() || '';

  const match = Object.entries(HOTEL_CONFIGS).find(
    ([key, cfg]) => key !== 'OTHER_EGYPT' && cfg.detect(name)
  );

  return match ? match[0] : 'OTHER_EGYPT';
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOMMODATION CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export const calculateAccommodation = (formData, hotelType) => {
  const acc = formData.accommodation_details || {};

  const usdAmount    = parseFloat(acc.usd_amount || acc.dollar_amount || 0);
  const exchangeRate = parseFloat(acc.exchange_rate || 0);
  const totalNights  = parseInt(acc.total_nights) || 0;

  if (usdAmount === 0 || exchangeRate === 0 || totalNights === 0) {
    return {
      usdAmount: 0,
      exchangeRate: 0,
      totalNights: 0,
      roomAmountEgp: 0,
      totalRoomAllNights: 0,
      breakdown: null,
      radissonBreakdown: null, // kept for any existing UI references
    };
  }

  const hotelCfg = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_EGYPT;
  const { roomAmountEgp, breakdown } = hotelCfg.calculateNightlyRate({ usdAmount, exchangeRate });

  const updateRoomAmountEgp  = Number(roomAmountEgp.toFixed(2));
  const totalRoomAllNights   = updateRoomAmountEgp * totalNights;

  return {
    usdAmount,
    exchangeRate,
    totalNights,
    roomAmountEgp: updateRoomAmountEgp,
    totalRoomAllNights,
    breakdown,
    radissonBreakdown: breakdown, // alias — keeps existing EgyptConditionalSection effect working
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export const calculateServices = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return { services: [], totalServicesGross: 0 };
  }

  const totalServicesGross = services.reduce((sum, service) => {
    return sum + parseFloat(service.gross_amount || 0);
  }, 0);

  return { services, totalServicesGross };
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
// Extract-and-step Egyptian tax breakdown from the combined gross total.
// Divisor 1.289568 = 1.12 × 1.01 × 1.14 — DO NOT CHANGE
// ─────────────────────────────────────────────────────────────────────────────

export const calculateFinalSummary = (formData, hotelType) => {
  const accCalc      = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);

  // 1. Combined gross pot using precise internal floats
  const grandTotalEgp = accCalc.totalRoomAllNights + servicesCalc.totalServicesGross;

  let baseTaxableAmount = 0;
  let serviceCharge     = 0;
  let cityTax           = 0;
  let vat14Percent      = 0;
  let balanceUsd        = 0;
  let basePlusScPlusCt  = 0;
  let totalInclVatHoliday = 0;

  if (grandTotalEgp > 0) {
    // 2. Extract base using exact divisor 1.289568
    baseTaxableAmount = grandTotalEgp / 1.289568;

    // 3. Step-by-step Egyptian taxes
    serviceCharge          = baseTaxableAmount * 0.12;
    const basePlusSc       = baseTaxableAmount + serviceCharge;
    cityTax                = basePlusSc * 0.01;
    basePlusScPlusCt       = basePlusSc + cityTax;
    vat14Percent           = basePlusScPlusCt * 0.14;
    totalInclVatHoliday    = basePlusScPlusCt + vat14Percent;

    // 4. USD balance — direction depends on whether rate is direct or inverse
    if (accCalc.exchangeRate > 0) {
      const cfg = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_EGYPT;
      balanceUsd = cfg.balanceDirection === 'multiply'
        ? grandTotalEgp * accCalc.exchangeRate
        : grandTotalEgp / accCalc.exchangeRate;
    }
  }

  // 5. Apply formatting ONLY at final output step
  return {
    total_taxable_amount: parseNum(baseTaxableAmount),
    total_service_charge: parseNum(serviceCharge),
    total_city_tax:       parseNum(cityTax),
    total_vat_14:         parseNum(vat14Percent),
    grand_total_egp:      parseNum(grandTotalEgp),
    balance_usd:          parseNum(balanceUsd),
    grand_total:          parseNum(grandTotalEgp),
    totalExVat:           parseNum(basePlusScPlusCt),
    totalInclVat:         parseNum(totalInclVatHoliday),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP TO BACKEND SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const mapToBackendSchema = (formData, hotelConfig) => {
  const hotelType    = detectHotelType(hotelConfig);
  const hotelCfg     = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_EGYPT;
  const accCalc      = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);
  const summary      = calculateFinalSummary(formData, hotelType);

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

  // Build one row object per night — each hotel's buildRow returns a single object.
  // The PDF template is responsible for visually expanding (e.g. Radisson's 4 sub-rows).
  const accommodationDetailsArray = [];
  const arrivalDate = new Date(formData.arrival_date);

  for (let i = 0; i < accCalc.totalNights; i++) {
    const currentDate = new Date(arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    const row = hotelCfg.buildRow({
      day:           i + 1,
      date:          dateStr,
      roomAmountEgp: accCalc.roomAmountEgp,
      breakdown:     accCalc.breakdown,
      usdAmount:     accCalc.usdAmount,
      exchangeRate:  accCalc.exchangeRate,
    });

    accommodationDetailsArray.push({ day: i + 1, ...row });
  }

  const otherServicesArray = servicesCalc.services.map(service => ({
    name:   capitalizeWords(service.service_name) || 'Service',
    amount: parseFloat(service.gross_amount || 0),
    date:   formatDate(service.service_date || formData.invoice_date),
  }));

  return {
    data: {
      hotel:        formData.hotel_name || '',
      hotelType,                             // useful for PDF template switching
      tableColumns: hotelCfg.columns,        // pass to renderer — no if/else needed there

      invoiceNo:  formData.invoice_no || '',
      guestName:  capitalizeWords(formData.guest_name) || 'Guest',
      address:    'Algeria Square Building Number 12 First Floor, Tripoli, Libya',
      companyName: 'Azar Tourism Services',
      referenceNo: formData.reference_no || '',
      arNumber:    formData.ar_number || '',
      roomNo:      formData.room_number || '',

      arrivalDate:      formatDate(formData.arrival_date),
      departureDate:    formatDate(formData.departure_date),
      invoiceDate:      formatDate(formData.invoice_date),
      invoiceTime:      formData.invoice_time || '',
      cashierId:        formData.cashier_id || '',
      ihgRewardsNumber: formData.ihg_rewards_number || '',

      status: formData.status || 'pending',
      note:   formData.note || '',
      userId: formData.user_id || '',

      //hilton extended fields
      ratePlan : formData.rate_plan || '',
      honorNo: formData.honors_no || '',
      vatNo: formData.vat_no || '',
      invoiceCopyNo: formData.invoice_copy_no || '',
      aL: formData.a_l || '',

      // Radisson / extended fields
      membershipNo: formData.membership_no || '',
      groupCode:    formData.group_code || '',
      folioNo:      formData.folio_no || '',
      confNo:       formData.conf_no || '',
      paxAdult:     formData.adults || 1,
      paxChild:     formData.children || 0,
      taxCardNo:    formData.tax_card_no || '',
      customRef:    formData.custom_ref || '',

      // Accommodation numbers
      nights:        accCalc.totalNights,
      usdAmount:     parseNum(accCalc.usdAmount),
      exchangeRate:  parseNum(accCalc.exchangeRate, 7),
      roomAmountEgp: parseNum(accCalc.roomAmountEgp),
      accommodationRefId: formData.accommodation_ref_id || [...Array(5)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random()*26)]).join(''),
servicesRefId: formData.services_ref_id || [...Array(5)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random()*26)]).join(''),
startingRefNo: formData.starting_ref_no || Math.floor(1000000 + Math.random() * 9000000),

      // Totals
      totalRoomGrossEgp:     parseNum(accCalc.totalRoomAllNights),
      totalServicesGrossEgp: parseNum(servicesCalc.totalServicesGross),
      baseTaxableAmount:     summary.total_taxable_amount,
      serviceCharge:         summary.total_service_charge,
      cityTax:               summary.total_city_tax,
      vat14Percent:          summary.total_vat_14,
      grandTotalEgp:         summary.grand_total_egp,
      balanceUsd:            summary.balance_usd,
      totalExVat:            summary.totalExVat,
      totalInclVat:          summary.totalInclVat,


      checkInTime:   formData.checkin_time || '',
      checkOutTime:  formData.checkout_time || '',

      accommodationDetails: accommodationDetailsArray,
      otherServices:        otherServicesArray,
    },
  };
};