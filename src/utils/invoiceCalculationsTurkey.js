/**
 * turkeyInvoiceCalculationsV2.js
 *
 * Egypt-style HOTEL_CONFIGS pattern for NEW Turkey invoices (7 hotels).
 *
 * HOW TO ADD A NEW HOTEL:
 * 1. Add one entry to HOTEL_CONFIGS below.
 * 2. Define detect(), calculateNightlyRate(), buildRow().
 * 3. Zero changes anywhere else.
 *
 * ─── SUMMARY FORMULA (same for ALL hotels) ───────────────────────────────────
 *   a  = EUR Amount × Exchange Rate           → room amount TRY (per night)
 *   b  = a × total_nights                     → total room all nights
 *   d  = b ÷ 1.12                             → taxable amount (room)
 *   g  = d × 0.10                             → VAT 10%
 *   j  = d × 0.02                             → Accommodation Tax 2%
 *   Services: gross ÷ 1.20 = taxable, taxable × 0.20 = VAT 20%
 *   f  = d + total_services_taxable           → total taxable
 *   i  = g + total_vat_20                     → total VAT
 *   k  = f + i + j                            → grand total TRY
 *   m  = k ÷ exchange_rate                    → grand total EUR
 *
 * ─── RADISSON PER-NIGHT ROW FORMULA (Harbiye, Collection, Blu Sisli) ─────────
 *   A  = EUR × exchangeRate                   → TRY amount (gross per night)
 *   B  = A ÷ 1.12                             → Net Amount (taxable)
 *   C  = B × 0.10                             → VAT 10%
 *   D  = B + C                                → Debit (total charge per night)
 *   E  = B × 0.02                             → Accommodation Tax (total)
 *   accTaxNetUnitPrice = E ÷ PAX              → Net Unit Price per person
 *   accTaxQty = PAX                           → Qty column
 *   accTaxNetAmount = E                       → Net Amount column
 *
 *   Each night produces TWO rows:
 *     Row 1: Otel Harcamaları / Hotel Expenses | Qty:1 | NetUnit:B | NetAmt:B | Tax:10% | TaxAmt:C | Debit:D
 *     Row 2: Accommodation Tax                 | Qty:PAX | NetUnit:E÷PAX | NetAmt:E | Tax:0% | TaxAmt:0 | Debit:E
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

// ─────────────────────────────────────────────────────────────────────────────
// RADISSON PER-NIGHT ROW BUILDER (shared by all 3 Radisson hotels)
// Returns TWO rows per night: hotel expenses + accommodation tax
// ─────────────────────────────────────────────────────────────────────────────

const buildRadissonNightRows = ({ date, roomAmountTry, pax }) => {
  const A = parseNum(roomAmountTry);         // Gross TRY (EUR × rate)
  const B = parseNum(A / 1.12);             // Net Amount (taxable)
  const C = parseNum(B * 0.10);            // VAT 10%
  const D = parseNum(B + C);              // Debit per night
  const E = parseNum(B * 0.02);           // Accommodation Tax total
  const paxCount = parseInt(pax) || 1;
  const accTaxNetUnitPrice = parseNum(E / paxCount);

  return {
    hotelExpenses: {
      date,
      description:  'Otel Harcamaları / Hotel Expenses',
      qty:          1,
      netUnitPrice: B,
      netAmount:    B,
      tax:          '10%',
      taxAmount:    C,
      debit:        D,
      credit:       0,
    },
    accommodationTax: {
      date,
      description:  'Accommodation Tax',
      qty:          paxCount,
      netUnitPrice: accTaxNetUnitPrice,
      netAmount:    E,
      tax:          '0%',
      taxAmount:    0,
      debit:        E,
      credit:       0,
    },
    A, B, C, D, E,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL CONFIGS
// To add a new hotel: add one entry here. Zero changes anywhere else.
// ─────────────────────────────────────────────────────────────────────────────

export const HOTEL_CONFIGS = {

  // ── 1. HILTON ISTANBUL BOSPHORUS ─────────────────────────────────────────
  HILTON_BOSPHORUS: {
    detect: (name) =>
      name.includes('hilton') &&
      (name.includes('bosphorus') || name.includes('istanbul bosphorus')),
    accommodationDescription: 'GUEST ROOM',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry, eurAmount, exchangeRate }) => ({
      date,
      description: 'GUEST ROOM',
      rateLabel:   `${eurAmount} EUR * ${exchangeRate}`,
      rate:        parseNum(roomAmountTry),
    }),
  },

  // ── 2. RADISSON HOTEL ISTANBUL HARBIYE ───────────────────────────────────
  // TWO rows per night — Hotel Expenses (10%) + Accommodation Tax (0%, per PAX)
  RADISSON_HARBIYE: {
    detect: (name) =>
      name.includes('radisson') &&
      name.includes('harbiye') &&
      !name.includes('blu') &&
      !name.includes('collection'),
    accommodationDescription: 'Otel Harcamaları / Hotel Expenses',
    currency: 'TRY',
    isRadisson: true,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry, pax }) =>
      buildRadissonNightRows({ date, roomAmountTry, pax }),
  },

  // ── 3. CHEYA HOTEL NİŞANTAŞI ─────────────────────────────────────────────
  CHEYA: {
    detect: (name) => name.includes('cheya'),
    accommodationDescription: 'Room Rates / Odalar',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry }) => ({
      date,
      description: 'Room Rates / Odalar',
      rate:        parseNum(roomAmountTry),
    }),
  },

  // ── 4. RADISSON COLLECTION HOTEL VADISTANBUL ─────────────────────────────
  // TWO rows per night + laundry services at 20% VAT
  RADISSON_COLLECTION: {
    detect: (name) =>
      name.includes('radisson') &&
      (name.includes('collection') || name.includes('vadistanbul')),
    accommodationDescription: 'Otel Harcamaları / Hotel Expenses',
    currency: 'TRY',
    isRadisson: true,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry, pax }) =>
      buildRadissonNightRows({ date, roomAmountTry, pax }),
  },

  // ── 5. THE MARMARA TAKSIM ────────────────────────────────────────────────
  MARMARA_TAKSIM: {
    detect: (name) => name.includes('marmara'),
    accommodationDescription: 'Accommodation Package',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry, exchangeRate }) => ({
      date,
      description:  'Accommodation Package',
      exchangeRate,
      rate:         parseNum(roomAmountTry),
    }),
  },

  // ── 6. RADISSON BLU HOTEL ISTANBUL SISLI ─────────────────────────────────
  // TWO rows per night — Hotel Expenses (10%) + Accommodation Tax (0%, per PAX)
  RADISSON_BLU_SISLI: {
    detect: (name) =>
      name.includes('radisson') &&
      name.includes('blu') &&
      (name.includes('sisli') || name.includes('şişli')),
    accommodationDescription: 'Otel Harcamaları / Hotel Expenses',
    currency: 'TRY',
    isRadisson: true,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry, pax }) =>
      buildRadissonNightRows({ date, roomAmountTry, pax }),
  },

  // ── 7. YOTELAIR ISTANBUL AIRPORT ─────────────────────────────────────────
  YOTELAIR: {
    detect: (name) => name.includes('yotel') || name.includes('yotelair'),
    accommodationDescription: 'Daily Charges',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({
      roomAmountTry: eurAmount * exchangeRate,
    }),
    buildRow: ({ date, roomAmountTry, eurAmount }) => ({
      date,
      description: 'Daily Charges',
      eurAmount:   parseNum(eurAmount),
      rate:        parseNum(roomAmountTry),
    }),
  },

  // ── EXISTING HOTELS ───────────────────────────────────────────────────────
  CVK: {
    detect: (name) => name.includes('cvk') || name.includes('park bosphorus'),
    accommodationDescription: 'Hébergement / Accommodation',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({ roomAmountTry: eurAmount * exchangeRate }),
    buildRow: ({ date, roomAmountTry }) => ({ date, description: 'Hébergement / Accommodation', rate: parseNum(roomAmountTry) }),
  },

  GRAND_ARAS: {
    detect: (name) => name.includes('grand') && name.includes('aras'),
    accommodationDescription: 'Hébergement / Accommodation',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({ roomAmountTry: eurAmount * exchangeRate }),
    buildRow: ({ date, roomAmountTry }) => ({ date, description: 'Hébergement / Accommodation', rate: parseNum(roomAmountTry) }),
  },

  TRYP: {
    detect: (name) => name.includes('tryp'),
    accommodationDescription: 'Hébergement / Accommodation',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({ roomAmountTry: eurAmount * exchangeRate }),
    buildRow: ({ date, roomAmountTry }) => ({ date, description: 'Hébergement / Accommodation', rate: parseNum(roomAmountTry) }),
  },

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  OTHER_TURKEY: {
    detect: () => true,
    accommodationDescription: 'Hébergement / Accommodation',
    currency: 'TRY',
    isRadisson: false,
    calculateNightlyRate: ({ eurAmount, exchangeRate }) => ({ roomAmountTry: eurAmount * exchangeRate }),
    buildRow: ({ date, roomAmountTry }) => ({ date, description: 'Hébergement / Accommodation', rate: parseNum(roomAmountTry) }),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECT HOTEL TYPE — priority order matters, specific before generic
// ─────────────────────────────────────────────────────────────────────────────

const PRIORITY_ORDER = [
  'HILTON_BOSPHORUS',
  'RADISSON_BLU_SISLI',
  'RADISSON_COLLECTION',
  'RADISSON_HARBIYE',
  'CHEYA',
  'MARMARA_TAKSIM',
  'YOTELAIR',
  'CVK',
  'GRAND_ARAS',
  'TRYP',
];

export const detectHotelType = (hotelConfig) => {
  const name = hotelConfig?.hotel_name?.toLowerCase() || '';
  for (const key of PRIORITY_ORDER) {
    const cfg = HOTEL_CONFIGS[key];
    if (cfg && cfg.detect(name)) return key;
  }
  return 'OTHER_TURKEY';
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOMMODATION CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

export const calculateAccommodation = (formData, hotelType) => {
  const acc = formData.accommodation_details || {};

  const eurAmount    = parseFloat(acc.eur_amount    || 0);
  const exchangeRate = parseFloat(acc.exchange_rate || 0);
  const totalNights  = parseInt(acc.total_nights)   || 0;
  const pax          = parseInt(formData.pax || formData.adults) || 1;

  if (eurAmount === 0 || exchangeRate === 0 || totalNights === 0) {
    return {
      eurAmount: 0, exchangeRate: 0, totalNights: 0, pax,
      roomAmountTry: 0, totalRoomAllNights: 0,
      taxableAmount: 0, vat10Percent: 0, accommodationTax: 0,
      radissonNightRows: [],
    };
  }

  const hotelCfg = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_TURKEY;
  const { roomAmountTry } = hotelCfg.calculateNightlyRate({ eurAmount, exchangeRate });

  const totalRoomAllNights = parseNum(roomAmountTry * totalNights);
  const taxableAmount      = parseNum(totalRoomAllNights / 1.12);
  const vat10Percent       = parseNum(taxableAmount * 0.10);
  const accommodationTax   = parseNum(taxableAmount * 0.02);

  // For Radisson: build per-night row breakdown
  const radissonNightRows = [];
  if (hotelCfg.isRadisson) {
    const arrivalDate = new Date(formData.arrival_date);
    for (let i = 0; i < totalNights; i++) {
      const d = new Date(arrivalDate);
      d.setDate(d.getDate() + i);
      radissonNightRows.push(
        buildRadissonNightRows({
          date:          d.toISOString().split('T')[0],
          roomAmountTry: parseNum(roomAmountTry),
          pax,
        })
      );
    }
  }

  return {
    eurAmount, exchangeRate, totalNights, pax,
    roomAmountTry:      parseNum(roomAmountTry),
    totalRoomAllNights,
    taxableAmount,
    vat10Percent,
    accommodationTax,
    radissonNightRows,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES CALCULATION  —  20% VAT, same for all hotels
// ─────────────────────────────────────────────────────────────────────────────

export const calculateServices = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return { services: [], totalGross: 0, totalTaxable: 0, totalVat20: 0 };
  }

  const calculatedServices = services.map(service => {
    const grossAmount = parseNum(service.gross_amount);
    if (grossAmount === 0) return { ...service, taxable_amount: 0, vat_20_percent: 0 };
    const taxableAmount = parseNum(grossAmount / 1.2);
    const vat20Percent  = parseNum(taxableAmount * 0.2);
    return { ...service, taxable_amount: taxableAmount, vat_20_percent: vat20Percent };
  });

  return {
    services:     calculatedServices,
    totalGross:   parseNum(calculatedServices.reduce((s, x) => s + parseNum(x.gross_amount), 0)),
    totalTaxable: parseNum(calculatedServices.reduce((s, x) => s + parseNum(x.taxable_amount), 0)),
    totalVat20:   parseNum(calculatedServices.reduce((s, x) => s + parseNum(x.vat_20_percent), 0)),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY  —  same for ALL hotels (including Radisson)
// ─────────────────────────────────────────────────────────────────────────────

export const calculateFinalSummary = (formData, hotelType) => {
  const accCalc      = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);

  const totalTaxableRoom    = accCalc.taxableAmount;
  const totalLaundryGross   = servicesCalc.totalGross;
  const totalLaundryTaxable = servicesCalc.totalTaxable;
  const totalVat10          = accCalc.vat10Percent;
  const totalVat20          = servicesCalc.totalVat20;
  const totalAccTax         = accCalc.accommodationTax;

  const totalTaxable = parseNum(totalTaxableRoom + totalLaundryTaxable);
  const totalVat     = parseNum(totalVat10 + totalVat20);
  const grandTotal   = parseNum(totalTaxable + totalVat + totalAccTax);
  const totalInEur   = accCalc.exchangeRate > 0
    ? parseNum(grandTotal / accCalc.exchangeRate) : 0;

  return {
    total_taxable_amount_room:     totalTaxableRoom,
    total_room_all_nights:         accCalc.totalRoomAllNights,
    total_laundry_amount:          totalLaundryGross,
    total_laundry_taxable:         totalLaundryTaxable,
    total_vat_10:                  totalVat10,
    total_vat_20:                  totalVat20,
    total_vat:                     totalVat,
    total_accommodation_tax:       totalAccTax,
    total_taxable_amount:          totalTaxable,
    grand_total:                   grandTotal,
    total_in_eur:                  totalInEur,
    total_amount:                  accCalc.totalRoomAllNights,
    total_including_vat_kdv_dahil: grandTotal,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP TO BACKEND SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const mapToBackendSchema = (formData, hotelConfig) => {
  const hotelType    = detectHotelType(hotelConfig);
  const hotelCfg     = HOTEL_CONFIGS[hotelType] || HOTEL_CONFIGS.OTHER_TURKEY;
  const accCalc      = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);
  const summary      = calculateFinalSummary(formData, hotelType);

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    return dateStr.split('T')[0];
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // ── Accommodation details array ────────────────────────────────────────────
  // Radisson: 2 row objects per night | Others: 1 row object per night
  const accommodationDetailsArray = [];
  const arrivalDate = new Date(formData.arrival_date);

  for (let i = 0; i < accCalc.totalNights; i++) {
    const currentDate = new Date(arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    if (hotelCfg.isRadisson) {
      const nightRows = accCalc.radissonNightRows[i];
      if (nightRows) {
        accommodationDetailsArray.push({
          day:              i + 1,
          date:             dateStr,
          hotelExpenses:    nightRows.hotelExpenses,
          accommodationTax: nightRows.accommodationTax,
          A: nightRows.A, B: nightRows.B,
          C: nightRows.C, D: nightRows.D, E: nightRows.E,
        });
      }
    } else {
      const row = hotelCfg.buildRow({
        day: i + 1, date: dateStr,
        roomAmountTry: accCalc.roomAmountTry,
        eurAmount:     accCalc.eurAmount,
        exchangeRate:  accCalc.exchangeRate,
      });
      accommodationDetailsArray.push({ day: i + 1, ...row });
    }
  }

  const otherServicesArray = servicesCalc.services.map(service => ({
    name:           capitalizeWords(service.service_name) || 'Service',
    amount:         parseNum(service.gross_amount),
    taxable_amount: parseNum(service.taxable_amount),
    vat_20_percent: parseNum(service.vat_20_percent),
    date:           formatDate(service.service_date || formData.invoice_date),
  }));

  return {
    data: {
      hotel: formData.hotel_name || '',
      hotelType,

      guestName:  capitalizeWords(formData.guest_name) || 'Guest',
      roomNo:     formData.room_number || '',
      passportNo: formData.passport_no || '',
      paxAdult:   parseInt(formData.adults) || 1,
      paxChild:   parseInt(formData.children) || 0,
      pax:        parseInt(formData.pax) || parseInt(formData.adults) || 1,

      invoiceDate:   formatDate(formData.invoice_date),
      arrivalDate:   formatDate(formData.arrival_date),
      departureDate: formatDate(formData.departure_date),

      referenceNo:  formData.reference_no   || formData.company_name || `INV-${Date.now()}`,
      voucherNo:    formData.voucher_no     || '',
      folioNo:      formData.folio_no       || formData.folio_number || '',
      userId:       formData.user_code      || formData.user_id      || '',
      batchNo:      formData.cash_no        || '',

      // HILTON BOSPHORUS
      ratePlan:       formData.rate_plan       || '',
      confirmationNo: formData.confirmation_no || '',
      cashierId:      formData.cashier_id      || '',
      frequentFlyer:  formData.frequent_flyer  || '',
      hiltonHonors:   formData.hilton_honors   || '',

      // RADISSON (all 3)
      invoiceN:    formData.invoice_n   || '',
      billingDate: formatDate(formData.billing_date || formData.invoice_date),
      party:       formData.party       || '',
      branch:      formData.branch      || '',
      reservation: formData.reservation || '',

      // CHEYA
      folyoNo:  formData.folyo_no  || '',
      odaNo:    formData.oda_no    || '',
      roomType: formData.room_type || '',
      kisi:     formData.kisi      || '',

      // MARMARA TAKSIM
      arNumber:    formData.ar_number    || '',
      confNo:      formData.conf_no      || '',
      cashierNo:   formData.cashier_no   || '',
      groupCode:   formData.group_code   || '',
      companyName: formData.company_name || '',
      accountNo:   formData.account_no   || '',

      // YOTELAIR
      invoiceNumber:      formData.invoice_number      || '',
      folioNumber:        formData.folio_number        || '',
      confirmationNumber: formData.confirmation_number || '',
      iataNumber:         formData.iata_number         || '',
      numberOfGuests:     formData.number_of_guests    || formData.adults || 1,

      nights:               accCalc.totalNights,
      eurAmount:            parseNum(accCalc.eurAmount),
      exchangeRate:         parseNum(accCalc.exchangeRate, 5),
      roomAmountTry:        parseNum(accCalc.roomAmountTry),
      totalRoomAllNights:   parseNum(accCalc.totalRoomAllNights),
      taxableAmount:        parseNum(accCalc.taxableAmount),
      vat10Percent:         parseNum(accCalc.vat10Percent),
      accommodationTax:     parseNum(accCalc.accommodationTax),

      totalServicesGross:   parseNum(servicesCalc.totalGross),
      totalServicesTaxable: parseNum(servicesCalc.totalTaxable),
      totalVat20:           parseNum(servicesCalc.totalVat20),

      totalTaxableAmount: parseNum(summary.total_taxable_amount),
      totalVat10:         parseNum(summary.total_vat_10),
      totalVat:           parseNum(summary.total_vat),
      totalAccTax:        parseNum(summary.total_accommodation_tax),
      grandTotal:         parseNum(summary.grand_total),
      totalInEur:         parseNum(summary.total_in_eur),

      accommodationDetails: accommodationDetailsArray,
      otherServices:        otherServicesArray,

      status: formData.status || 'pending',
      note:   formData.note   || '',

      vat5: 0, newVat1_10: 0, newVat7: 0, newVat20: 0, newVat5: 0,
      cityTaxRows: 0, cityTaxAmount: 0, stampTaxRows: 0,
      stampTaxAmount: 0, stampTaxTotal: 0, cityTaxTotal: 0,
      cityTaxDetails: [], stampTaxDetails: [],
    },
  };
};