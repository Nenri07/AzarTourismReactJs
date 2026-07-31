// ─────────────────────────────────────────────────────────────────────────────
// TUNISIA INVOICE CALCULATIONS
// Currency: TND (Tunisian Dinar)
//
// COMMON TAX CHAIN (all hotels):
//   grandTotal  = total charged (accommodation + services)
//   base        = grandTotal / 1.0807         ← Total Hors Taxes / Net Taxable
//   fdcst       = base * 0.01                 ← FDCST 1%
//   d           = base + fdcst                ← intermediate
//   vat7        = d * 0.07                    ← VAT 7%
//   totalTTC    = grandTotal (already incl. taxes)
//   cityTax     = from form (3 TND × nb persons per night)
//   stampTax    = from form (fixed 1 TND)
//   balanceUSD  = grandTotal / exchangeRate   (USD)
//   balanceEUR  = grandTotal / exchangeEurRate (EUR)
//
// HOTEL DIFFERENCES:
//   STANDARD GROUP  (Novotel, ADAM, Radisson Blu, Concorde, Mövenpick, Le Corail):
//     → Room rate in TND directly (no USD/EUR conversion needed in table)
//     → Accommodation row = nightly room rate
//
//   FOUR SEASONS + MARRIOTT:
//     → Amount entered in EUR + exchange rate
//     → Table row: accommodation = (EUR × rate) / 1.0807  (net base per night)
//     → Per-night FDCST 1% and VAT 7% shown inline in table
//     → Summary also shows Balance EUR and Balance USD
//     → Marriott uses "Package" label instead of "Accommodation"
//
//   LE CORAIL:
//     → Generate 6-char alphanumeric ref for room (accommodationRefId)
//       and 6-char ref for services (servicesRefId) — created ONCE, never regenerated
//
// ─────────────────────────────────────────────────────────────────────────────

export const parseNum = (value, decimals = 3) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

const gen6Ref = () =>
  [...Array(6)]
    .map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)])
    .join('');

// ─────────────────────────────────────────────────────────────────────────────
// HOTEL CONFIGS
// ─────────────────────────────────────────────────────────────────────────────
export const HOTEL_CONFIGS_TUNISIA = {

  // ── 1. NOVOTEL ────────────────────────────────────────────────────────────
  // Room rate in TND directly entered
  // Table cols: Date, Description, Debits TND, Credits TND
  // Summary: Net Taxable, FDCST 1%, VAT 7%, City Tax, Stamp Tax, Total Gross
  NOVOTEL: {
    detect: (name) => name.includes('novotel'),
    inputCurrency: 'TND',
    tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'Hébergement',
    buildRow: ({ date, roomAmountTnd }) => ({
      date,
      description: 'Hébergement',
      debitTnd: parseNum(roomAmountTnd),
      creditTnd: 0,
    }),
    showPerNightTax: false,
    balanceCurrencies: ['USD'],
  },

  // ── 2. ADAM HOTEL SUITES ──────────────────────────────────────────────────
  // "Lodging" label, City tax shown per night in table
  // Table cols: Date, Description, Débit TND, Crédit TND
  ADAM: {
    detect: (name) => name.includes('adam'),
    inputCurrency: 'TND',
    tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'Lodging',
    buildRow: ({ date, roomAmountTnd }) => ({
      date,
      description: 'Lodging',
      debitTnd: parseNum(roomAmountTnd),
      creditTnd: 0,
    }),
    showPerNightTax: true,
    balanceCurrencies: ['USD'],
  },

  // ── 3. RADISSON BLU (Tunis Convention) ───────────────────────────────────
  // "Bed and Breakfast" label, simple table
  // Table cols: Prestation, QTE, NB JOURS, PU, TOTAL
  RADISSON_BLU_TUNIS: {
    detect: (name) => name.includes('radisson') && name.includes('tunis'),
    inputCurrency: 'TND',
    tableColumns: ['prestation', 'qty', 'nbJours', 'pu', 'total'],
    descriptionLabel: 'Bed and Breakfast',
    buildRow: ({ roomAmountTnd, totalNights }) => ({
      prestation: 'Bed and Breakfast',
      qty: 1,
      nbJours: totalNights,
      pu: parseNum(roomAmountTnd),
      total: parseNum(roomAmountTnd * totalNights),
    }),
    showPerNightTax: false,
    balanceCurrencies: ['USD'],
  },

  // ── 4. CONCORDE LES BERGES DU LAC ────────────────────────────────────────
  // "accommodation" label (lowercase), simple table
  CONCORDE: {
    detect: (name) => name.includes('concorde'),
    inputCurrency: 'TND',
    tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'accommodation',
    buildRow: ({ date, roomAmountTnd }) => ({
      date,
      description: 'Accommodation',
      debitTnd: parseNum(roomAmountTnd),
      creditTnd: 0,
    }),
    showPerNightTax: false,
    balanceCurrencies: ['USD'],
  },

  // ── 5. MÖVENPICK ─────────────────────────────────────────────────────────
  // "Accommodation" label, Qty column, two Debit/Credit sets
  MOVENPICK: {
    detect: (name) => name.includes('movenpick') || name.includes('mövenpick'),
    inputCurrency: 'TND',
    tableColumns: ['date', 'description', 'qty', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'Accommodation',
    buildRow: ({ date, roomAmountTnd }) => ({
      date,
      description: 'Accommodation',
      qty: 1,
      debitTnd: parseNum(roomAmountTnd),
      creditTnd: 0,
    }),
    showPerNightTax: false,
    balanceCurrencies: ['USD'],
  },

  // ── 6. LE CORAIL SUITES ──────────────────────────────────────────────────
  // "Tarifs Agence de Voyage 25" label, has Pensio/Roo/Voucher/Qty columns
  // Generates accommodationRefId (6-char) and servicesRefId (6-char) ONCE at creation
  LE_CORAIL: {
    detect: (name) => name.includes('corail'),
    inputCurrency: 'TND',
    tableColumns: ['date', 'detail', 'pensio', 'room', 'voucher', 'qty', 'debit', 'credit'],
    descriptionLabel: 'Tarifs Agence de Voyage 25',
    buildRow: ({ date, roomAmountTnd, roomNo, accommodationRefId }) => ({
      date,
      detail: 'Tarifs Agence de Voyage 25',
      pensio: 'LO',
      room: roomNo || '',
      voucher: accommodationRefId || '',
      qty: 1,
      debit: parseNum(roomAmountTnd),
      credit: 0,
    }),
    showPerNightTax: false,
    generateRefs: true, // accommodationRefId + servicesRefId generated once
    balanceCurrencies: ['USD'],
  },

  // ── 7. FOUR SEASONS TUNIS ────────────────────────────────────────────────
  // Input: EUR amount + EUR exchange rate
  // Table row: Accommodation = (EUR * rate) / 1.0807 per night
  //            + inline FDCST 1% and City Tax per day
  // Summary also shows Balance EUR + Balance USD
  FOUR_SEASONS_TUNIS: {
    detect: (name) => name.includes('four season') || name.includes('fourseason'),
    inputCurrency: 'EUR',
    tableColumns: ['date', 'description', 'charges', 'credits'],
    descriptionLabel: 'Accommodation',
    buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
      date,
      description: 'Accommodation',
      charges: parseNum(roomAmountTnd), // = (EUR * rate) / 1.0807 — net per night
      credits: 0,
      eurAmount: parseNum(eurAmount),
      exchangeRate: parseNum(exchangeRate, 5),
    }),
    showPerNightTax: true, // FDCST and City Tax shown per day in table
    balanceCurrencies: ['EUR', 'USD'],
  },

  // ── 8. SHERATON TUNIS (Marriott brand) ───────────────────────────────────
  // Same calc as Four Seasons but label is "Package" or service names
  // Table cols: Date, Texte, Debit TND, Credits TND
  // Taxes (FDCST, VAT) shown inline per day
  SHERATON_TUNIS: {
    detect: (name) => name.includes('sheraton'),
    inputCurrency: 'EUR', // Sheraton uses TND directly (retail + accommodation routed)
    tableColumns: ['date', 'texte', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'Accommodation',
   buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
      date,
      description: 'Package',
      debitTnd: parseNum(roomAmountTnd), // = (EUR * rate) / 1.0807 net per night
      creditTnd: 0,
      eurAmount: parseNum(eurAmount),
      exchangeRate: parseNum(exchangeRate, 5),
    }),
    showPerNightTax: true, // FDCST and VAT shown inline per night
    balanceCurrencies: ['EUR'],
  },

  // ── 9. TUNIS MARRIOTT ────────────────────────────────────────────────────
  // Input: EUR amount + EUR exchange rate (same as Four Seasons)
  // Label: "Package" instead of "Accommodation"
  // Per-night: Package = (EUR * rate) / 1.0807, + inline FDCST, VAT 7%
  // Summary: Balance TND, Balance EUR, Balance USD
  TUNIS_MARRIOTT: {
    detect: (name) => name.includes('marriott'),
    inputCurrency: 'EUR',
    tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'Package',
    buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
      date,
      description: 'Package',
      debitTnd: parseNum(roomAmountTnd), // = (EUR * rate) / 1.0807 net per night
      creditTnd: 0,
      eurAmount: parseNum(eurAmount),
      exchangeRate: parseNum(exchangeRate, 5),
    }),
    showPerNightTax: true, // FDCST and VAT shown inline per night
    balanceCurrencies: ['EUR', 'USD'],
  },

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  OTHER_TUNISIA: {
    detect: () => true,
    inputCurrency: 'TND',
    tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
    descriptionLabel: 'Accommodation',
    buildRow: ({ date, roomAmountTnd }) => ({
      date,
      description: 'Accommodation',
      debitTnd: parseNum(roomAmountTnd),
      creditTnd: 0,
    }),
    showPerNightTax: false,
    balanceCurrencies: ['USD'],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DETECT HOTEL TYPE
// ─────────────────────────────────────────────────────────────────────────────
export const detectHotelTypeTunisia = (hotelConfig) => {
  const name = (hotelConfig?.hotel_name || '').toLowerCase();
  const match = Object.entries(HOTEL_CONFIGS_TUNISIA).find(
    ([key, cfg]) => key !== 'OTHER_TUNISIA' && cfg.detect(name)
  );
  return match ? match[0] : 'OTHER_TUNISIA';
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOMMODATION CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
// export const calculateAccommodationTunisia = (formData, hotelType) => {
//   const acc = formData.accommodation_details || {};
//   const cfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;

//   const totalNights = parseInt(acc.total_nights) || 0;
//   const cityTaxPerPerson = parseFloat(acc.city_tax_per_person || 3);
//   const nbPersons = parseInt(acc.nb_persons || formData.nb_persons || 1);
//   const cityTaxPerNight = cityTaxPerPerson * nbPersons; // e.g. 3 TND × 3 persons = 9 TND/night

//   let roomAmountTnd = 0;
//   let eurAmount = 0;
//   let exchangeRate = 0;
//   let exchangeUsdRate = 0;

//   if (cfg.inputCurrency === 'EUR') {
//     // Four Seasons / Marriott: EUR × rate = gross TND per night
//     // The accommodation row in table = gross / 1.0807 (net, tax-excluded)
//     eurAmount = parseFloat(acc.eur_amount || 0);
//     exchangeRate = parseFloat(acc.exchange_rate || 0); // EUR→TND rate
//     exchangeUsdRate = parseFloat(acc.exchange_usd_rate || 0); // TND→USD rate
//     const grossTnd = eurAmount * exchangeRate;
//     roomAmountTnd = grossTnd / 1.0807; // net base shown in table
//   } else {
//     // TND direct entry
//     roomAmountTnd = parseFloat(acc.room_amount_tnd || 0);
//     exchangeUsdRate = parseFloat(acc.exchange_usd_rate || 0);
//     eurAmount = 0;
//     exchangeRate = 0;
//   }

//   const totalRoomAllNights = roomAmountTnd * totalNights;

//   return {
//     roomAmountTnd,
//     eurAmount,
//     exchangeRate,
//     exchangeUsdRate,
//     totalNights,
//     cityTaxPerNight,
//     nbPersons,
//     totalRoomAllNights,
//     inputCurrency: cfg.inputCurrency,
//   };
// };

export const calculateAccommodationTunisia = (formData, hotelType) => {
 const acc = formData.accommodation_details || {};
  const cfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;

  const totalNights = parseInt(acc.total_nights) || 0;
  const cityTaxPerPerson = parseFloat(acc.city_tax_per_person || 0);

  const adults = parseInt(formData.nb_adults, 10) || 0;
  const children = parseInt(formData.nb_children, 10) || 0;
  const nperson1 = parseInt(formData.nb_persons, 10) || 0;
  
  const nbperson2= parseInt(acc.nb_persons, 10) || 0;
  const nbperson3 = nperson1? nperson1 : nbperson2;
  const adultsPlusChildren = adults + children;
    console.log("these are values", nperson1,nbperson2,nbperson3,adultsPlusChildren, children,adults);


  // priority: explicit accommodation_details override > adults+children > legacy nb_persons > 1
  const nbPersons = nbperson3 > adultsPlusChildren ? nbperson3 : adultsPlusChildren || 0;

  const cityTaxPerNight = cityTaxPerPerson * nbPersons;

  let roomAmountTnd = 0;
  let eurAmount = 0;
  let exchangeRate = 0;
  let exchangeUsdRate = 0;
  let sellingRate = 0;

  if (cfg.inputCurrency === 'EUR') {
    // Four Seasons / Marriott — UNCHANGED, no tradeoff here
    eurAmount = parseFloat(acc.eur_amount || 0);
    exchangeRate = parseFloat(acc.exchange_rate || 0);
    exchangeUsdRate = parseFloat(acc.exchange_usd_rate || 0);
    const grossTnd = eurAmount * exchangeRate;
    roomAmountTnd = grossTnd / 1.0807;
  } else {
    // TND-input hotels — matches the original Novotel form exactly:
    // New Room Rate (per night) = Exchange Rate × Selling Rate
    sellingRate = parseFloat(acc.selling_rate || 0);
    exchangeRate = parseFloat(acc.exchange_rate || 0);
    roomAmountTnd = exchangeRate * sellingRate;
    exchangeUsdRate = parseFloat(acc.exchange_usd_rate || 0);
    eurAmount = 0;
  }

  const totalRoomAllNights = roomAmountTnd * totalNights;

  return {
    roomAmountTnd, eurAmount, exchangeRate, exchangeUsdRate, sellingRate,
    totalNights, cityTaxPerNight, nbPersons, totalRoomAllNights,
    inputCurrency: cfg.inputCurrency,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES CALCULATION
// ─────────────────────────────────────────────────────────────────────────────
export const calculateServicesTunisia = (services = []) => {
  if (!Array.isArray(services) || services.length === 0)
    return { services: [], totalServicesGross: 0 };

  const totalServicesGross = services.reduce(
    (sum, s) => sum + parseFloat(s.gross_amount || 0),
    0
  );
  return { services, totalServicesGross };
};

// ─────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
//
// grandTotal  = totalRoomAllNights + totalServicesGross
//               (this is the TTC amount already inclusive of all taxes)
// base        = grandTotal / 1.0807   → Total Hors Taxes / Net Taxable
// fdcst       = base * 0.01
// d           = base + fdcst
// vat7        = d * 0.07
// cityTaxTotal= cityTaxPerNight * totalNights  (3 TND × persons × nights)
// stampTax    = 1 TND (fixed, from form)
// totalTTC    = grandTotal (= base + fdcst + vat7 + cityTaxTotal + stampTax)
// balanceUSD  = grandTotal / exchangeUsdRate
// balanceEUR  = grandTotal / exchangeEurRate  (Four Seasons / Marriott only)
// ─────────────────────────────────────────────────────────────────────────────
// export const calculateFinalSummaryTunisia = (formData, hotelType) => {
//   const accCalc = calculateAccommodationTunisia(formData, hotelType);
//   const servicesCalc = calculateServicesTunisia(formData.other_services);

//   const stampTax = parseFloat(formData.accommodation_details?.stamp_tax ?? 1);
//   const totalNights = accCalc.totalNights;
//   const cityTaxTotal = accCalc.cityTaxPerNight * totalNights;

//   // Grand total = accommodation (gross TND) + services
//   // For EUR hotels: gross per night = eurAmount * exchangeRate (before /1.0807 split)
//   let accommodationGross = 0;
//   if (accCalc.inputCurrency === 'EUR') {
//     accommodationGross = accCalc.eurAmount * accCalc.exchangeRate * totalNights;
//   } else {
//     // For TND hotels the room_amount_tnd entered IS the gross nightly (already incl. tax)
//     accommodationGross = accCalc.totalRoomAllNights;
//   }

//   const grandTotal = accommodationGross + servicesCalc.totalServicesGross + cityTaxTotal + stampTax;

//   let base = 0, fdcst = 0, d = 0, vat7 = 0, balanceUsd = 0, balanceEur = 0;

//   if (grandTotal > 0) {
//     base  = grandTotal / 1.0807;
//     fdcst = base * 0.01;
//     d     = base + fdcst;
//     vat7  = d * 0.07;

//     if (accCalc.exchangeUsdRate > 0)
//       balanceUsd = grandTotal / accCalc.exchangeUsdRate;

//     if (accCalc.exchangeRate > 0 && accCalc.inputCurrency === 'EUR')
//       balanceEur = grandTotal / accCalc.exchangeRate;
//   }

//   return {
//     grand_total_tnd:   parseNum(grandTotal),
//     total_hors_taxes:  parseNum(base),       // Net Taxable / Total HT
//     fdcst_1pct:        parseNum(fdcst),
//     vat_7pct:          parseNum(vat7),
//     city_tax_total:    parseNum(cityTaxTotal),
//     stamp_tax:         parseNum(stampTax),
//     total_ttc:         parseNum(grandTotal), // same as grandTotal
//     balance_usd:       parseNum(balanceUsd),
//     balance_eur:       parseNum(balanceEur), // non-zero only for EUR hotels
//     // convenience
//     acc_gross:         parseNum(accommodationGross),
//     services_gross:    parseNum(servicesCalc.totalServicesGross),
//   };
// };

export const calculateFinalSummaryTunisia = (formData, hotelType) => {
  const accCalc = calculateAccommodationTunisia(formData, hotelType);
  const servicesCalc = calculateServicesTunisia(formData.other_services);

  const stampTax = parseFloat(formData.accommodation_details?.stamp_tax ?? 1);
  const totalNights = accCalc.totalNights;
  const cityTaxTotal = accCalc.cityTaxPerNight * totalNights;

  let accommodationGross = 0;
  if (accCalc.inputCurrency === 'EUR') {
    accommodationGross = accCalc.eurAmount * accCalc.exchangeRate * totalNights;
  } else {
    accommodationGross = accCalc.totalRoomAllNights;
  }

  // Taxable base = accommodation + services ONLY (matches original Novotel formula)
  const totalFromForm = accommodationGross + servicesCalc.totalServicesGross;

  let netTaxable = 0, fdcst = 0, vat7 = 0, balanceUsd = 0, balanceEur = 0;

  if (totalFromForm > 0) {
    netTaxable = totalFromForm / 1.0807;
    fdcst = netTaxable * 0.01;
    vat7 = (netTaxable + fdcst) * 0.07;
  }

  // Grand total = taxable chain + city tax + stamp tax, added exactly once
  const grandTotal = netTaxable + fdcst + vat7 + cityTaxTotal + stampTax;

  if (accCalc.exchangeUsdRate > 0) balanceUsd = grandTotal / accCalc.exchangeUsdRate;
  if (accCalc.exchangeRate > 0 && accCalc.inputCurrency === 'EUR')
    balanceEur = grandTotal / accCalc.exchangeRate;
  console.log("this is grand total and eur", grandTotal, accCalc.exchangeRate);
  

  return {
    grand_total_tnd: parseNum(grandTotal),
    total_hors_taxes: parseNum(netTaxable),
    fdcst_1pct: parseNum(fdcst),
    vat_7pct: parseNum(vat7),
    city_tax_total: parseNum(cityTaxTotal),
    stamp_tax: parseNum(stampTax),
    total_ttc: parseNum(grandTotal),
    balance_usd: parseNum(balanceUsd,2),
    balance_eur: parseNum(balanceEur,2),
    acc_gross: parseNum(accommodationGross),
    services_gross: parseNum(servicesCalc.totalServicesGross),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MAP TO BACKEND SCHEMA
// ─────────────────────────────────────────────────────────────────────────────
export const mapToBackendSchemaTunisia = (formData, hotelConfig) => {
  const hotelType = detectHotelTypeTunisia(hotelConfig);
  const hotelCfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
  const accCalc = calculateAccommodationTunisia(formData, hotelType);
  const svcCalc = calculateServicesTunisia(formData.other_services);
  const summary = calculateFinalSummaryTunisia(formData, hotelType);

  const formatDate = (d) => (d ? d.split('T')[0] : new Date().toISOString().split('T')[0]);
  const cap = (s) => {
    if (!s) return '';
    return s.trim().replace(/\s+/g, ' ')
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  // Build per-night accommodation rows
  const accommodationRows = [];
  const arrDate = new Date(formData.arrival_date);
  for (let i = 0; i < accCalc.totalNights; i++) {
    const cur = new Date(arrDate);
    cur.setDate(cur.getDate() + i);
    const dateStr = cur.toISOString().split('T')[0];

    const row = hotelCfg.buildRow({
      day: i + 1,
      date: dateStr,
      roomAmountTnd: accCalc.roomAmountTnd,
      eurAmount: accCalc.eurAmount,
      exchangeRate: accCalc.exchangeRate,
      roomNo: formData.room_number,
      accommodationRefId: formData.accommodation_ref_id,
    });
    accommodationRows.push({ day: i + 1, ...row });
  }


  // City tax rows — one per night (new field, matches schema, no existing hotel config to conflict with)
  const cityTaxRows = [];
  for (let i = 0; i < accCalc.totalNights; i++) {
    const cur = new Date(arrDate);
    cur.setDate(cur.getDate() + i);
    cityTaxRows.push({
      day: i + 1,
      date: cur.toISOString().split('T')[0],
      description: 'Taxe de séjour',
      amount: parseNum(accCalc.cityTaxPerNight),
    });
  }

  // Stamp tax — one-time row, first night only
  const stampTaxRows = summary.stamp_tax > 0
    ? [{
      day: 1,
      date: formatDate(formData.arrival_date),
      description: 'Timbre fiscal',
      amount: parseNum(summary.stamp_tax),
    }]
    : [];
  // Services
const otherServicesArray = svcCalc.services.map(s => ({
  name: cap(s.service_name) || 'Service',
  description: s.service_description || '',
  quantity: parseInt(s.quantity || 1),
  voucher: s.service_voucher || '',
  amount: parseFloat(s.gross_amount || 0),
  date: formatDate(s.service_date || formData.invoice_date),
}));
  // Le Corail refs — generate once, persist on edit/duplicate
  const accommodationRefId =
    formData.accommodation_ref_id ||
    (hotelCfg.generateRefs ? gen6Ref() : '');
  const servicesRefId =
    formData.services_ref_id ||
    (hotelCfg.generateRefs ? gen6Ref() : '');

  return {
    data: {
      // ── Hotel identity ──
      hotel: formData.hotel_name || '',
      hotelType,
      refferenceNo: formData.reference_no || '',
      tableColumns: hotelCfg.tableColumns,
      inputCurrency: hotelCfg.inputCurrency,
      showPerNightTax: hotelCfg.showPerNightTax,
      balanceCurrencies: hotelCfg.balanceCurrencies,

      // ── Guest & invoice header ──
      invoiceNo: formData.invoice_no || '',
      folioNo: formData.folio_no || '',
      confirmationNo: formData.confirmation_no || '',
      guestName: cap(formData.guest_name) || 'Guest',
      roomNo: formData.room_number || '',
      nbPersons: parseInt(formData.nb_persons || 1),
      adults: parseInt(formData.nb_adults),
      children: parseInt(formData.nb_children),
      arrangementRate: formData.arrangement_rate || '',  // e.g. "CORP_C_BB"

      // ── Company / billing ──
      companyName: 'Azar Tourism Services',
      address: 'Tripoli Tower Ground Floor Office no 50, Tripoli, Libya',
      arAccount: formData.ar_account || '',           // A/R Account: AZA001
      taxId: formData.tax_id || '',
      vatNo: formData.vat_no || '',
      membershipNo: formData.membership_no || '',
      userId: formData.user_id || '',
      cashierId: formData.cashier_id || '',
      cashierName: formData.cashier_name || '',

      // ── Dates ──
      arrivalDate: formatDate(formData.arrival_date),
      departureDate: formatDate(formData.departure_date),
      invoiceDate: formatDate(formData.invoice_date),
      invoiceTime: formData.invoice_time || '',

      // ── Accommodation numbers ──
      nights: accCalc.totalNights,
      roomAmountTnd: parseNum(accCalc.roomAmountTnd),
      eurAmount: parseNum(accCalc.eurAmount),
      exchangeRate: parseNum(accCalc.exchangeRate, 2),
sellingRate:  parseNum(accCalc.sellingRate, 3),   // NEW — needed to reconstruct the form on edit
      exchangeUsdRate: parseNum(accCalc.exchangeUsdRate, 2),   // TND→USD
      cityTaxPerPerson: parseNum(accCalc.cityTaxPerNight / Math.max(accCalc.nbPersons, 1)),
      cityTaxPerNight: parseNum(accCalc.cityTaxPerNight),
      stampTax: parseNum(parseFloat(formData.accommodation_details?.stamp_tax ?? 1)),

      // ── Totals ──
      totalRoomGrossTnd: parseNum(summary.acc_gross),
      totalServicesGrossTnd: parseNum(summary.services_gross),
      grandTotalTnd: summary.grand_total_tnd,
      totalHorsTaxes: summary.total_hors_taxes,  // Net Taxable / Total HT
      fdcst1Pct: summary.fdcst_1pct,
      vat7Pct: summary.vat_7pct,
      cityTaxTotal: summary.city_tax_total,
      stampTaxTotal: summary.stamp_tax,
      totalTtc: summary.total_ttc,
      balanceUsd: summary.balance_usd,
      balanceEur: summary.balance_eur,       // 0 for non-EUR hotels

      // ── Refs (Le Corail specific, harmless for others) ──
      accommodationRefId,
      servicesRefId,

      accommodationDetails: accommodationRows,   // unchanged — still hotelCfg.buildRow-driven
      cityTaxDetails: cityTaxRows,        // NEW
      stampTaxDetails: stampTaxRows,       // NEW
      otherServices: otherServicesArray, // unchanged
      // ── Status / notes ──
      status: formData.status || 'pending',
      note: formData.note || '',
    },
  };
};




// ─────────────────────────────────────────────────────────────────────────────
// TUNISIA INVOICE CALCULATIONS
// Currency: TND (Tunisian Dinar)
//
// COMMON TAX CHAIN (all hotels):
//   grandTotal  = total charged (accommodation + services)
//   base        = grandTotal / 1.0807         ← Total Hors Taxes / Net Taxable
//   fdcst       = base * 0.01                 ← FDCST 1%
//   d           = base + fdcst                ← intermediate
//   vat7        = d * 0.07                    ← VAT 7%
//   totalTTC    = grandTotal (already incl. taxes)
//   cityTax     = from form (persons × per-person rate × nights)
//   stampTax    = from form (fixed 1 TND)
//
// BALANCE (foreign currency) — matches the original Novotel view exactly:
//   TND hotels:  accommodation = exchangeRate × sellingRate  (per night)
//                → sellingRate is quoted in the invoice's foreign currency,
//                  exchangeRate converts it to TND.
//                → Balance = grandTotal / exchangeRate  (reuses the SAME rate —
//                  no separate "USD rate" field needed, since that's exactly
//                  what reverses the room calc back to the original currency)
//   EUR hotels (Four Seasons/Marriott): two genuinely independent rates —
//                EUR→TND for the room cost, TND→USD for the USD balance —
//                so exchange_usd_rate stays a real, separate input there.
//
// HOTEL DIFFERENCES:
//   STANDARD GROUP  (Novotel, ADAM, Radisson Blu, Concorde, Mövenpick, Le Corail):
//     → Nightly rate = Exchange Rate × Selling Rate (foreign currency in, TND out)
//     → Accommodation row = nightly room rate in TND
//
//   FOUR SEASONS + MARRIOTT:
//     → Amount entered in EUR + exchange rate
//     → Table row: accommodation = (EUR × rate) / 1.0807  (net base per night)
//     → Per-night FDCST 1% and VAT 7% shown inline in table
//     → Summary also shows Balance EUR and Balance USD
//     → Marriott uses "Package" label instead of "Accommodation"
//
//   LE CORAIL:
//     → Generate 6-char alphanumeric ref for room (accommodationRefId)
//       and 6-char ref for services (servicesRefId) — created ONCE, never regenerated
//
// ─────────────────────────────────────────────────────────────────────────────

// export const parseNum = (value, decimals = 3) => {
//   const num = parseFloat(value || 0);
//   return isNaN(num) ? 0 : Number(num.toFixed(decimals));
// };

// const gen6Ref = () =>
//   [...Array(6)]
//     .map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)])
//     .join('');

// // ─────────────────────────────────────────────────────────────────────────────
// // HOTEL CONFIGS
// // ─────────────────────────────────────────────────────────────────────────────
// export const HOTEL_CONFIGS_TUNISIA = {

//   // ── 1. NOVOTEL ────────────────────────────────────────────────────────────
//   NOVOTEL: {
//     detect: (name) => name.includes('novotel'),
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Hébergement',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Hébergement',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   // ── 2. ADAM HOTEL SUITES ──────────────────────────────────────────────────
//   ADAM: {
//     detect: (name) => name.includes('adam'),
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Lodging',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Lodging',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['USD'],
//   },

//   // ── 3. RADISSON BLU (Tunis Convention) ───────────────────────────────────
//   RADISSON_BLU_TUNIS: {
//     detect: (name) => name.includes('radisson') && name.includes('tunis'),
//     inputCurrency: 'TND',
//     tableColumns: ['prestation', 'qty', 'nbJours', 'pu', 'total'],
//     descriptionLabel: 'Bed and Breakfast',
//     buildRow: ({ roomAmountTnd, totalNights }) => ({
//       prestation: 'Bed and Breakfast',
//       qty: 1,
//       nbJours: totalNights,
//       pu: parseNum(roomAmountTnd),
//       total: parseNum(roomAmountTnd * totalNights),
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   // ── 4. CONCORDE LES BERGES DU LAC ────────────────────────────────────────
//   CONCORDE: {
//     detect: (name) => name.includes('concorde'),
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'accommodation',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   // ── 5. MÖVENPICK ─────────────────────────────────────────────────────────
//   MOVENPICK: {
//     detect: (name) => name.includes('movenpick') || name.includes('mövenpick'),
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'description', 'qty', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Accommodation',
//       qty: 1,
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   // ── 6. LE CORAIL SUITES ──────────────────────────────────────────────────
//   LE_CORAIL: {
//     detect: (name) => name.includes('corail'),
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'detail', 'pensio', 'room', 'voucher', 'qty', 'debit', 'credit'],
//     descriptionLabel: 'Tarifs Agence de Voyage 25',
//     buildRow: ({ date, roomAmountTnd, roomNo, accommodationRefId }) => ({
//       date,
//       detail: 'Tarifs Agence de Voyage 25',
//       pensio: 'LO',
//       room: roomNo || '',
//       voucher: accommodationRefId || '',
//       qty: 1,
//       debit: parseNum(roomAmountTnd),
//       credit: 0,
//     }),
//     showPerNightTax: false,
//     generateRefs: true, // accommodationRefId + servicesRefId generated once
//     balanceCurrencies: ['USD'],
//   },

//   // ── 7. FOUR SEASONS TUNIS ────────────────────────────────────────────────
//   FOUR_SEASONS_TUNIS: {
//     detect: (name) => name.includes('four season') || name.includes('fourseason'),
//     inputCurrency: 'EUR',
//     tableColumns: ['date', 'description', 'charges', 'credits'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
//       date,
//       description: 'Accommodation',
//       charges: parseNum(roomAmountTnd), // = (EUR * rate) / 1.0807 — net per night
//       credits: 0,
//       eurAmount: parseNum(eurAmount),
//       exchangeRate: parseNum(exchangeRate, 5),
//     }),
//     showPerNightTax: true, // FDCST and City Tax shown per day in table
//     balanceCurrencies: ['EUR', 'USD'],
//   },

//   // ── 8. SHERATON TUNIS (Marriott brand) ───────────────────────────────────
//   SHERATON_TUNIS: {
//     detect: (name) => name.includes('sheraton'),
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'texte', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       texte: 'Accommodation',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['USD'],
//   },

//   // ── 9. TUNIS MARRIOTT ────────────────────────────────────────────────────
//   TUNIS_MARRIOTT: {
//     detect: (name) => name.includes('marriott'),
//     inputCurrency: 'EUR',
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Package',
//     buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
//       date,
//       description: 'Package',
//       debitTnd: parseNum(roomAmountTnd), // = (EUR * rate) / 1.0807 net per night
//       creditTnd: 0,
//       eurAmount: parseNum(eurAmount),
//       exchangeRate: parseNum(exchangeRate, 5),
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['EUR', 'USD'],
//   },

//   // ── FALLBACK ──────────────────────────────────────────────────────────────
//   OTHER_TUNISIA: {
//     detect: () => true,
//     inputCurrency: 'TND',
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Accommodation',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // DETECT HOTEL TYPE
// // ─────────────────────────────────────────────────────────────────────────────
// export const detectHotelTypeTunisia = (hotelConfig) => {
//   const name = (hotelConfig?.hotel_name || '').toLowerCase();
//   const match = Object.entries(HOTEL_CONFIGS_TUNISIA).find(
//     ([key, cfg]) => key !== 'OTHER_TUNISIA' && cfg.detect(name)
//   );
//   return match ? match[0] : 'OTHER_TUNISIA';
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ACCOMMODATION CALCULATION
// // ─────────────────────────────────────────────────────────────────────────────
// export const calculateAccommodationTunisia = (formData, hotelType) => {
//   const acc = formData.accommodation_details || {};
//   const cfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;

//   const totalNights = parseInt(acc.total_nights) || 0;
//   const cityTaxPerPerson = parseFloat(acc.city_tax_per_person || 3);
//   const nbPersons = parseInt(acc.nb_persons || formData.nb_persons || 1);
//   const cityTaxPerNight = cityTaxPerPerson * nbPersons;

//   let roomAmountTnd = 0;
//   let eurAmount = 0;
//   let exchangeRate = 0;
//   let exchangeUsdRate = 0;
//   let sellingRate = 0;

//   if (cfg.inputCurrency === 'EUR') {
//     // Four Seasons / Marriott — unchanged. Two genuinely independent rates:
//     // EUR→TND for the room cost, TND→USD for the balance.
//     eurAmount = parseFloat(acc.eur_amount || 0);
//     exchangeRate = parseFloat(acc.exchange_rate || 0);
//     exchangeUsdRate = parseFloat(acc.exchange_usd_rate || 0);
//     const grossTnd = eurAmount * exchangeRate;
//     roomAmountTnd = grossTnd / 1.0807;
//   } else {
//     // TND-input hotels — matches the original Novotel form exactly:
//     // New Room Rate (per night) = Exchange Rate × Selling Rate
//     // sellingRate is quoted in the invoice's foreign currency; exchangeRate
//     // converts it to TND. Reversing the same rate later recovers the balance
//     // in that same currency — no separate "USD rate" field is needed.
//     sellingRate = parseFloat(acc.selling_rate || 0);
//     exchangeRate = parseFloat(acc.exchange_rate || 0);
//     roomAmountTnd = exchangeRate * sellingRate;
//     // Optional explicit override, only used if the person deliberately fills it
//     // in with a different rate than the one used for the room calculation.
//     exchangeUsdRate = parseFloat(acc.exchange_usd_rate || 0);
//     eurAmount = 0;
//   }

//   const totalRoomAllNights = roomAmountTnd * totalNights;

//   return {
//     roomAmountTnd, eurAmount, exchangeRate, exchangeUsdRate, sellingRate,
//     totalNights, cityTaxPerNight, nbPersons, totalRoomAllNights,
//     inputCurrency: cfg.inputCurrency,
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SERVICES CALCULATION
// // ─────────────────────────────────────────────────────────────────────────────
// export const calculateServicesTunisia = (services = []) => {
//   if (!Array.isArray(services) || services.length === 0)
//     return { services: [], totalServicesGross: 0 };

//   const totalServicesGross = services.reduce(
//     (sum, s) => sum + parseFloat(s.gross_amount || 0),
//     0
//   );
//   return { services, totalServicesGross };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // FINAL SUMMARY
// //
// // totalFromForm = accommodationGross + servicesGross   (city/stamp tax excluded —
// //                 not taxable revenue, added once at the very end)
// // netTaxable    = totalFromForm / 1.0807
// // fdcst         = netTaxable * 0.01
// // vat7          = (netTaxable + fdcst) * 0.07
// // grandTotal    = netTaxable + fdcst + vat7 + cityTaxTotal + stampTax
// //
// // balanceUsd / balanceEur — see the file header note on how each hotel type
// // reverses its own rate back into a foreign-currency balance.
// // ─────────────────────────────────────────────────────────────────────────────
// export const calculateFinalSummaryTunisia = (formData, hotelType) => {
//   const accCalc = calculateAccommodationTunisia(formData, hotelType);
//   const servicesCalc = calculateServicesTunisia(formData.other_services);

//   const stampTax = parseFloat(formData.accommodation_details?.stamp_tax ?? 1);
//   const totalNights = accCalc.totalNights;
//   const cityTaxTotal = accCalc.cityTaxPerNight * totalNights;

//   let accommodationGross = 0;
//   if (accCalc.inputCurrency === 'EUR') {
//     accommodationGross = accCalc.eurAmount * accCalc.exchangeRate * totalNights;
//   } else {
//     accommodationGross = accCalc.totalRoomAllNights;
//   }

//   // Taxable base = accommodation + services ONLY (matches original Novotel formula)
//   const totalFromForm = accommodationGross + servicesCalc.totalServicesGross;

//   let netTaxable = 0, fdcst = 0, vat7 = 0, balanceUsd = 0, balanceEur = 0;

//   if (totalFromForm > 0) {
//     netTaxable = totalFromForm / 1.0807;
//     fdcst = netTaxable * 0.01;
//     vat7 = (netTaxable + fdcst) * 0.07;
//   }

//   // Grand total = taxable chain + city tax + stamp tax, added exactly once
//   const grandTotal = netTaxable + fdcst + vat7 + cityTaxTotal + stampTax;

//   if (accCalc.inputCurrency === 'EUR') {
//     // Four Seasons / Marriott — two independent rates, unchanged
//     if (accCalc.exchangeUsdRate > 0) balanceUsd = grandTotal / accCalc.exchangeUsdRate;
//     if (accCalc.exchangeRate > 0) balanceEur = grandTotal / accCalc.exchangeRate;
//   } else {
//     // TND-input hotels — THE FIX:
//     // Reuse the SAME exchangeRate that built the room cost to reverse the
//     // grand total back into that currency. This is exactly what the
//     // original Novotel view did (totalDebit / invoice.exchangeRate) — a
//     // single rate serving both directions, not two separate fields.
//     // An explicit exchange_usd_rate, if the person deliberately fills one
//     // in, still takes priority as an override.
//     if (accCalc.exchangeUsdRate > 0) {
//       balanceUsd = grandTotal / accCalc.sellingRate;
//     } else if (accCalc.exchangeRate > 0) {
//       balanceUsd = grandTotal / accCalc.exchangeRate;
//     }
//   }

//   return {
//     grand_total_tnd: parseNum(grandTotal),
//     total_hors_taxes: parseNum(netTaxable),
//     fdcst_1pct: parseNum(fdcst),
//     vat_7pct: parseNum(vat7),
//     city_tax_total: parseNum(cityTaxTotal),
//     stamp_tax: parseNum(stampTax),
//     total_ttc: parseNum(grandTotal),
//     balance_usd: parseNum(balanceUsd),
//     balance_eur: parseNum(balanceEur),
//     acc_gross: parseNum(accommodationGross),
//     services_gross: parseNum(servicesCalc.totalServicesGross),
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // MAP TO BACKEND SCHEMA
// // ─────────────────────────────────────────────────────────────────────────────
// export const mapToBackendSchemaTunisia = (formData, hotelConfig) => {
//   const hotelType = detectHotelTypeTunisia(hotelConfig);
//   const hotelCfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
//   const accCalc = calculateAccommodationTunisia(formData, hotelType);
//   const svcCalc = calculateServicesTunisia(formData.other_services);
//   const summary = calculateFinalSummaryTunisia(formData, hotelType);

//   const formatDate = (d) => (d ? d.split('T')[0] : new Date().toISOString().split('T')[0]);
//   const cap = (s) => {
//     if (!s) return '';
//     return s.trim().replace(/\s+/g, ' ')
//       .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
//   };

//   // Build per-night accommodation rows
//   const accommodationRows = [];
//   const arrDate = new Date(formData.arrival_date);
//   for (let i = 0; i < accCalc.totalNights; i++) {
//     const cur = new Date(arrDate);
//     cur.setDate(cur.getDate() + i);
//     const dateStr = cur.toISOString().split('T')[0];

//     const row = hotelCfg.buildRow({
//       day: i + 1,
//       date: dateStr,
//       roomAmountTnd: accCalc.roomAmountTnd,
//       eurAmount: accCalc.eurAmount,
//       exchangeRate: accCalc.exchangeRate,
//       roomNo: formData.room_number,
//       accommodationRefId: formData.accommodation_ref_id,
//     });
//     accommodationRows.push({ day: i + 1, ...row });
//   }

//   // City tax rows — one per night
//   const cityTaxRows = [];
//   for (let i = 0; i < accCalc.totalNights; i++) {
//     const cur = new Date(arrDate);
//     cur.setDate(cur.getDate() + i);
//     cityTaxRows.push({
//       day: i + 1,
//       date: cur.toISOString().split('T')[0],
//       description: 'Taxe de séjour',
//       amount: parseNum(accCalc.cityTaxPerNight),
//     });
//   }

//   // Stamp tax — one-time row, first night only
//   const stampTaxRows = summary.stamp_tax > 0
//     ? [{
//         day: 1,
//         date: formatDate(formData.arrival_date),
//         description: 'Timbre fiscal',
//         amount: parseNum(summary.stamp_tax),
//       }]
//     : [];

//   // Services
//   const otherServicesArray = svcCalc.services.map(s => ({
//     name: cap(s.service_name) || 'Service',
//     amount: parseFloat(s.gross_amount || 0),
//     date: formatDate(s.service_date || formData.invoice_date),
//   }));

//   // Le Corail refs — generate once, persist on edit/duplicate
//   const accommodationRefId =
//     formData.accommodation_ref_id ||
//     (hotelCfg.generateRefs ? gen6Ref() : '');
//   const servicesRefId =
//     formData.services_ref_id ||
//     (hotelCfg.generateRefs ? gen6Ref() : '');

//   return {
//     data: {
//       // ── Hotel identity ──
//       hotel: formData.hotel_name || '',
//       hotelType,
//       refferenceNo: formData.reference_no || '',
//       tableColumns: hotelCfg.tableColumns,
//       inputCurrency: hotelCfg.inputCurrency,
//       showPerNightTax: hotelCfg.showPerNightTax,
//       balanceCurrencies: hotelCfg.balanceCurrencies,

//       // ── Guest & invoice header ──
//       invoiceNo: formData.invoice_no || '',
//       folioNo: formData.folio_no || '',
//       confirmationNo: formData.confirmation_no || '',
//       guestName: cap(formData.guest_name) || 'Guest',
//       roomNo: formData.room_number || '',
//       nbPersons: parseInt(formData.nb_persons || 1),
//       adults: parseInt(formData.nb_adults),
//       children: parseInt(formData.nb_children),
//       arrangementRate: formData.arrangement_rate || '',

//       // ── Company / billing ──
//       companyName: 'Azar Tourism Services',
//       address: 'Algeria Square Building Number 12 First Floor, Tripoli, Libya',
//       arAccount: formData.ar_account || '',
//       taxId: formData.tax_id || '',
//       vatNo: formData.vat_no || '',
//       membershipNo: formData.membership_no || '',
//       userId: formData.user_id || '',
//       cashierId: formData.cashier_id || '',
//       cashierName: formData.cashier_name || '',

//       // ── Dates ──
//       arrivalDate: formatDate(formData.arrival_date),
//       departureDate: formatDate(formData.departure_date),
//       invoiceDate: formatDate(formData.invoice_date),
//       invoiceTime: formData.invoice_time || '',

//       // ── Accommodation numbers ──
//       nights: accCalc.totalNights,
//       roomAmountTnd: parseNum(accCalc.roomAmountTnd),
//       eurAmount: parseNum(accCalc.eurAmount),
//       exchangeRate: parseNum(accCalc.exchangeRate, 5),
//       sellingRate: parseNum(accCalc.sellingRate, 3),        // needed to reconstruct the form on edit
//       exchangeUsdRate: parseNum(accCalc.exchangeUsdRate, 5), // EUR hotels: real rate. TND hotels: optional override only.
//       cityTaxPerPerson: parseNum(accCalc.cityTaxPerNight / Math.max(accCalc.nbPersons, 1)),
//       cityTaxPerNight: parseNum(accCalc.cityTaxPerNight),
//       stampTax: parseNum(parseFloat(formData.accommodation_details?.stamp_tax ?? 1)),

//       // ── Totals ──
//       totalRoomGrossTnd: parseNum(summary.acc_gross),
//       totalServicesGrossTnd: parseNum(summary.services_gross),
//       grandTotalTnd: summary.grand_total_tnd,
//       totalHorsTaxes: summary.total_hors_taxes,
//       fdcst1Pct: summary.fdcst_1pct,
//       vat7Pct: summary.vat_7pct,
//       cityTaxTotal: summary.city_tax_total,
//       stampTaxTotal: summary.stamp_tax,
//       totalTtc: summary.total_ttc,
//       balanceUsd: summary.balance_usd,
//       balanceEur: summary.balance_eur,

//       // ── Refs (Le Corail specific, harmless for others) ──
//       accommodationRefId,
//       servicesRefId,

//       accommodationDetails: accommodationRows,
//       cityTaxDetails: cityTaxRows,
//       stampTaxDetails: stampTaxRows,
//       otherServices: otherServicesArray,

//       // ── Status / notes ──
//       status: formData.status || 'pending',
//       note: formData.note || '',
//     },
//   };
// };



// ─────────────────────────────────────────────────────────────────────────────
// TUNISIA INVOICE CALCULATIONS — Currency: TND (Tunisian Dinar)
//
// TAX CHAIN (all hotels):
//   accommodationGross = nightly room rate × nights
//   totalFromForm = accommodationGross + servicesGross
//   netTaxable    = totalFromForm / 1.0807
//   fdcst         = netTaxable * 0.01
//   vat7          = (netTaxable + fdcst) * 0.07
//   grandTotal    = netTaxable + fdcst + vat7 + cityTaxTotal + stampTax
//
// BALANCE USD — ONE variable, every hotel type, no exceptions:
//   balanceUsd = grandTotal / sellingRate
//
// BALANCE EUR — Four Seasons / Marriott only, unrelated to the USD variable:
//   balanceEur = grandTotal / exchangeRate   (reverses the EUR→TND room rate)
//
// ROOM COST:
//   TND hotels (Novotel, ADAM, Radisson Blu, Concorde, Mövenpick, Le Corail,
//   Sheraton): roomAmountTnd = exchangeRate × sellingRate
//   EUR hotels (Four Seasons, Marriott): roomAmountTnd = (eurAmount × exchangeRate) / 1.0807
//
// ACCOMMODATION FIELDS ARE CONFIG-DRIVEN — every hotel config below carries
// an `accommodationFields` array (spread from the two shared field sets just
// below) and an `accommodationHint` string. Nothing in the UI component
// branches on hotel type; it just renders whatever fields the active config
// hands it.
//
// LE CORAIL: generates a 6-char alphanumeric ref for room (accommodationRefId)
// and one for services (servicesRefId) — created ONCE, never regenerated.
// ─────────────────────────────────────────────────────────────────────────────

// export const parseNum = (value, decimals = 3) => {
//   const num = parseFloat(value || 0);
//   return isNaN(num) ? 0 : Number(num.toFixed(decimals));
// };

// const gen6Ref = () =>
//   [...Array(6)]
//     .map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)])
//     .join('');

// // ─────────────────────────────────────────────────────────────────────────────
// // SHARED ACCOMMODATION FIELD SETS
// // `computed: true` = render readOnly, driven by calculateAccommodationTunisia()
// // at render time. Everything else is a normal editable input.
// // ─────────────────────────────────────────────────────────────────────────────
// const EUR_ACCOMMODATION_FIELDS = [
//   { id: 'eur_amount', label: 'Amount (EUR)', type: 'number', step: '0.01', placeholder: 'e.g. 350' },
//   { id: 'exchange_rate', label: 'EUR → TND Rate', type: 'number', step: '0.00001', placeholder: 'e.g. 3.3310' },
//   { id: 'selling_rate', label: 'Selling Rate (USD balance)', type: 'number', step: '0.01', placeholder: 'e.g. 3.33' },
//   { id: 'room_amount_tnd_computed', label: 'Net Room Amount / Night (TND)', type: 'number', computed: true },
// ];

// const TND_ACCOMMODATION_FIELDS = [
//   { id: 'exchange_rate', label: 'Exchange Rate', type: 'number', step: '0.001', placeholder: 'e.g. 3.33' },
//   { id: 'selling_rate', label: 'Selling Rate', type: 'number', step: '0.01', placeholder: 'e.g. 456' },
//   { id: 'room_amount_tnd_computed', label: 'New Room Rate (Calculated, TND)', type: 'number', computed: true },
// ];

// const EUR_HINT = 'Enter amount in EUR + exchange rate (EUR→TND)';
// const TND_HINT = 'Enter Exchange Rate × Selling Rate — matches the standard nightly rate calculation';

// // ─────────────────────────────────────────────────────────────────────────────
// // HOTEL CONFIGS
// // ─────────────────────────────────────────────────────────────────────────────
// export const HOTEL_CONFIGS_TUNISIA = {

//   NOVOTEL: {
//     detect: (name) => name.includes('novotel'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Hébergement',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Hébergement',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   ADAM: {
//     detect: (name) => name.includes('adam'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Lodging',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Lodging',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['USD'],
//   },

//   RADISSON_BLU_TUNIS: {
//     detect: (name) => name.includes('radisson') && name.includes('tunis'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['prestation', 'qty', 'nbJours', 'pu', 'total'],
//     descriptionLabel: 'Bed and Breakfast',
//     buildRow: ({ roomAmountTnd, totalNights }) => ({
//       prestation: 'Bed and Breakfast',
//       qty: 1,
//       nbJours: totalNights,
//       pu: parseNum(roomAmountTnd),
//       total: parseNum(roomAmountTnd * totalNights),
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   CONCORDE: {
//     detect: (name) => name.includes('concorde'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'accommodation',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   MOVENPICK: {
//     detect: (name) => name.includes('movenpick') || name.includes('mövenpick'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'qty', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Accommodation',
//       qty: 1,
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },

//   LE_CORAIL: {
//     detect: (name) => name.includes('corail'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'detail', 'pensio', 'room', 'voucher', 'qty', 'debit', 'credit'],
//     descriptionLabel: 'Tarifs Agence de Voyage 25',
//     buildRow: ({ date, roomAmountTnd, roomNo, accommodationRefId }) => ({
//       date,
//       detail: 'Tarifs Agence de Voyage 25',
//       pensio: 'LO',
//       room: roomNo || '',
//       voucher: accommodationRefId || '',
//       qty: 1,
//       debit: parseNum(roomAmountTnd),
//       credit: 0,
//     }),
//     showPerNightTax: false,
//     generateRefs: true,
//     balanceCurrencies: ['USD'],
//   },

//   FOUR_SEASONS_TUNIS: {
//     detect: (name) => name.includes('four season') || name.includes('fourseason'),
//     inputCurrency: 'EUR',
//     accommodationHint: EUR_HINT,
//     accommodationFields: [...EUR_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'charges', 'credits'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
//       date,
//       description: 'Accommodation',
//       charges: parseNum(roomAmountTnd),
//       credits: 0,
//       eurAmount: parseNum(eurAmount),
//       exchangeRate: parseNum(exchangeRate, 5),
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['EUR', 'USD'],
//   },

//   SHERATON_TUNIS: {
//     detect: (name) => name.includes('sheraton'),
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'texte', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       texte: 'Accommodation',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['USD'],
//   },

//   TUNIS_MARRIOTT: {
//     detect: (name) => name.includes('marriott'),
//     inputCurrency: 'EUR',
//     accommodationHint: EUR_HINT,
//     accommodationFields: [...EUR_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Package',
//     buildRow: ({ date, roomAmountTnd, eurAmount, exchangeRate }) => ({
//       date,
//       description: 'Package',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//       eurAmount: parseNum(eurAmount),
//       exchangeRate: parseNum(exchangeRate, 5),
//     }),
//     showPerNightTax: true,
//     balanceCurrencies: ['EUR', 'USD'],
//   },

//   OTHER_TUNISIA: {
//     detect: () => true,
//     inputCurrency: 'TND',
//     accommodationHint: TND_HINT,
//     accommodationFields: [...TND_ACCOMMODATION_FIELDS],
//     tableColumns: ['date', 'description', 'debitTnd', 'creditTnd'],
//     descriptionLabel: 'Accommodation',
//     buildRow: ({ date, roomAmountTnd }) => ({
//       date,
//       description: 'Accommodation',
//       debitTnd: parseNum(roomAmountTnd),
//       creditTnd: 0,
//     }),
//     showPerNightTax: false,
//     balanceCurrencies: ['USD'],
//   },
// };

// // ─────────────────────────────────────────────────────────────────────────────
// export const detectHotelTypeTunisia = (hotelConfig) => {
//   const name = (hotelConfig?.hotel_name || '').toLowerCase();
//   const match = Object.entries(HOTEL_CONFIGS_TUNISIA).find(
//     ([key, cfg]) => key !== 'OTHER_TUNISIA' && cfg.detect(name)
//   );
//   return match ? match[0] : 'OTHER_TUNISIA';
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // ACCOMMODATION CALCULATION
// // sellingRate is read the same way for every hotel type — it's the ONLY
// // variable balanceUsd is ever divided by, downstream. No exchangeUsdRate
// // anywhere in this file.
// // ─────────────────────────────────────────────────────────────────────────────
// export const calculateAccommodationTunisia = (formData, hotelType) => {
//   const acc = formData.accommodation_details || {};
//   const cfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;

//   const totalNights = parseInt(acc.total_nights) || 0;
//   const cityTaxPerPerson = parseFloat(acc.city_tax_per_person || 3);
//   const nbPersons = parseInt(acc.nb_persons || formData.nb_persons || 1);
//   const cityTaxPerNight = cityTaxPerPerson * nbPersons;

//   const sellingRate = parseFloat(acc.selling_rate || 0);

//   let roomAmountTnd = 0;
//   let eurAmount = 0;
//   let exchangeRate = 0;

//   if (cfg.inputCurrency === 'EUR') {
//     // Four Seasons / Marriott — room cost math. sellingRate plays no part
//     // here, only in the USD balance below.
//     eurAmount = parseFloat(acc.eur_amount || 0);
//     exchangeRate = parseFloat(acc.exchange_rate || 0);
//     const grossTnd = eurAmount * exchangeRate;
//     roomAmountTnd = grossTnd / 1.0807;
//   } else {
//     // TND-input hotels: New Room Rate = Exchange Rate × Selling Rate
//     exchangeRate = parseFloat(acc.exchange_rate || 0);
//     roomAmountTnd = exchangeRate * sellingRate;
//     eurAmount = 0;
//   }

//   const totalRoomAllNights = roomAmountTnd * totalNights;

//   return {
//     roomAmountTnd, eurAmount, exchangeRate, sellingRate,
//     totalNights, cityTaxPerNight, nbPersons, totalRoomAllNights,
//     inputCurrency: cfg.inputCurrency,
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SERVICES CALCULATION
// // Each entry: service_name, service_date, gross_amount, quantity, description, code.
// // Total is summed off gross_amount — quantity is line metadata, not a
// // multiplier, unless you want it to auto-multiply against a unit price later.
// // ─────────────────────────────────────────────────────────────────────────────
// export const calculateServicesTunisia = (services = []) => {
//   if (!Array.isArray(services) || services.length === 0)
//     return { services: [], totalServicesGross: 0 };

//   const totalServicesGross = services.reduce(
//     (sum, s) => sum + parseFloat(s.gross_amount || 0),
//     0
//   );
//   return { services, totalServicesGross };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // FINAL SUMMARY
// // balanceUsd = grandTotal / sellingRate — always, every hotel type.
// // balanceEur = grandTotal / exchangeRate — EUR hotels only, unrelated to
// // the sellingRate/USD variable.
// // ─────────────────────────────────────────────────────────────────────────────
// export const calculateFinalSummaryTunisia = (formData, hotelType) => {
//   const accCalc = calculateAccommodationTunisia(formData, hotelType);
//   const servicesCalc = calculateServicesTunisia(formData.other_services);

//   const stampTax = parseFloat(formData.accommodation_details?.stamp_tax ?? 1);
//   const totalNights = accCalc.totalNights;
//   const cityTaxTotal = accCalc.cityTaxPerNight * totalNights;

//   let accommodationGross = 0;
//   if (accCalc.inputCurrency === 'EUR') {
//     accommodationGross = accCalc.eurAmount * accCalc.exchangeRate * totalNights;
//   } else {
//     accommodationGross = accCalc.totalRoomAllNights;
//   }

//   const totalFromForm = accommodationGross + servicesCalc.totalServicesGross;

//   let netTaxable = 0, fdcst = 0, vat7 = 0, balanceUsd = 0, balanceEur = 0;

//   if (totalFromForm > 0) {
//     netTaxable = totalFromForm / 1.0807;
//     fdcst = netTaxable * 0.01;
//     vat7 = (netTaxable + fdcst) * 0.07;
//   }

//   const grandTotal = netTaxable + fdcst + vat7 + cityTaxTotal + stampTax;

//   if (accCalc.sellingRate > 0) {
//     balanceUsd = grandTotal / accCalc.sellingRate;
//   }

//   if (accCalc.inputCurrency === 'EUR' && accCalc.exchangeRate > 0) {
//     balanceEur = grandTotal / accCalc.exchangeRate;
//   }

//   return {
//     grand_total_tnd: parseNum(grandTotal),
//     total_hors_taxes: parseNum(netTaxable),
//     fdcst_1pct: parseNum(fdcst),
//     vat_7pct: parseNum(vat7),
//     city_tax_total: parseNum(cityTaxTotal),
//     stamp_tax: parseNum(stampTax),
//     total_ttc: parseNum(grandTotal),
//     balance_usd: parseNum(balanceUsd),
//     balance_eur: parseNum(balanceEur),
//     acc_gross: parseNum(accommodationGross),
//     services_gross: parseNum(servicesCalc.totalServicesGross),
//   };
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // MAP TO BACKEND SCHEMA
// // ─────────────────────────────────────────────────────────────────────────────
// export const mapToBackendSchemaTunisia = (formData, hotelConfig) => {
//   const hotelType = detectHotelTypeTunisia(hotelConfig);
//   const hotelCfg = HOTEL_CONFIGS_TUNISIA[hotelType] || HOTEL_CONFIGS_TUNISIA.OTHER_TUNISIA;
//   const accCalc = calculateAccommodationTunisia(formData, hotelType);
//   const svcCalc = calculateServicesTunisia(formData.other_services);
//   const summary = calculateFinalSummaryTunisia(formData, hotelType);

//   const formatDate = (d) => (d ? d.split('T')[0] : new Date().toISOString().split('T')[0]);
//   const cap = (s) => {
//     if (!s) return '';
//     return s.trim().replace(/\s+/g, ' ')
//       .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
//   };

//   // Per-night accommodation rows
//   const accommodationRows = [];
//   const arrDate = new Date(formData.arrival_date);
//   for (let i = 0; i < accCalc.totalNights; i++) {
//     const cur = new Date(arrDate);
//     cur.setDate(cur.getDate() + i);
//     const dateStr = cur.toISOString().split('T')[0];

//     const row = hotelCfg.buildRow({
//       day: i + 1,
//       date: dateStr,
//       roomAmountTnd: accCalc.roomAmountTnd,
//       eurAmount: accCalc.eurAmount,
//       exchangeRate: accCalc.exchangeRate,
//       roomNo: formData.room_number,
//       accommodationRefId: formData.accommodation_ref_id,
//     });
//     accommodationRows.push({ day: i + 1, ...row });
//   }

//   // City tax rows — one per night
//   const cityTaxRows = [];
//   for (let i = 0; i < accCalc.totalNights; i++) {
//     const cur = new Date(arrDate);
//     cur.setDate(cur.getDate() + i);
//     cityTaxRows.push({
//       day: i + 1,
//       date: cur.toISOString().split('T')[0],
//       description: 'Taxe de séjour',
//       amount: parseNum(accCalc.cityTaxPerNight),
//     });
//   }

//   // Stamp tax — one-time row, first night only
//   const stampTaxRows = summary.stamp_tax > 0
//     ? [{
//         day: 1,
//         date: formatDate(formData.arrival_date),
//         description: 'Timbre fiscal',
//         amount: parseNum(summary.stamp_tax),
//       }]
//     : [];

//   // Services — includes quantity, description, code
//   const otherServicesArray = svcCalc.services.map(s => ({
//     name: cap(s.service_name) || 'Service',
//     code: s.code || '',
//     description: s.description || '',
//     quantity: parseInt(s.quantity || 1),
//     amount: parseFloat(s.gross_amount || 0),
//     date: formatDate(s.service_date || formData.invoice_date),
//   }));

//   // Le Corail refs — generate once, persist on edit/duplicate
//   const accommodationRefId =
//     formData.accommodation_ref_id ||
//     (hotelCfg.generateRefs ? gen6Ref() : '');
//   const servicesRefId =
//     formData.services_ref_id ||
//     (hotelCfg.generateRefs ? gen6Ref() : '');

//   return {
//     data: {
//       // ── Hotel identity ──
//       hotel: formData.hotel_name || '',
//       hotelType,
//       refferenceNo: formData.reference_no || '',
//       tableColumns: hotelCfg.tableColumns,
//       inputCurrency: hotelCfg.inputCurrency,
//       showPerNightTax: hotelCfg.showPerNightTax,
//       balanceCurrencies: hotelCfg.balanceCurrencies,

//       // ── Guest & invoice header ──
//       invoiceNo: formData.invoice_no || '',
//       folioNo: formData.folio_no || '',
//       confirmationNo: formData.confirmation_no || '',
//       guestName: cap(formData.guest_name) || 'Guest',
//       roomNo: formData.room_number || '',
//       nbPersons: parseInt(formData.nb_persons || 1),
//       adults: parseInt(formData.nb_adults),
//       children: parseInt(formData.nb_children),
//       arrangementRate: formData.arrangement_rate || '',

//       // ── Company / billing ──
//       companyName: 'Azar Tourism Services',
//       address: 'Algeria Square Building Number 12 First Floor, Tripoli, Libya',
//       arAccount: formData.ar_account || '',
//       taxId: formData.tax_id || '',
//       vatNo: formData.vat_no || '',
//       membershipNo: formData.membership_no || '',
//       userId: formData.user_id || '',
//       cashierId: formData.cashier_id || '',
//       cashierName: formData.cashier_name || '',

//       // ── Dates ──
//       arrivalDate: formatDate(formData.arrival_date),
//       departureDate: formatDate(formData.departure_date),
//       invoiceDate: formatDate(formData.invoice_date),
//       invoiceTime: formData.invoice_time || '',

//       // ── Accommodation numbers ──
//       nights: accCalc.totalNights,
//       roomAmountTnd: parseNum(accCalc.roomAmountTnd),
//       eurAmount: parseNum(accCalc.eurAmount),
//       exchangeRate: parseNum(accCalc.exchangeRate, 5),
//       sellingRate: parseNum(accCalc.sellingRate, 3),
//       cityTaxPerPerson: parseNum(accCalc.cityTaxPerNight / Math.max(accCalc.nbPersons, 1)),
//       cityTaxPerNight: parseNum(accCalc.cityTaxPerNight),
//       stampTax: parseNum(parseFloat(formData.accommodation_details?.stamp_tax ?? 1)),

//       // ── Totals ──
//       totalRoomGrossTnd: parseNum(summary.acc_gross),
//       totalServicesGrossTnd: parseNum(summary.services_gross),
//       grandTotalTnd: summary.grand_total_tnd,
//       totalHorsTaxes: summary.total_hors_taxes,
//       fdcst1Pct: summary.fdcst_1pct,
//       vat7Pct: summary.vat_7pct,
//       cityTaxTotal: summary.city_tax_total,
//       stampTaxTotal: summary.stamp_tax,
//       totalTtc: summary.total_ttc,
//       balanceUsd: summary.balance_usd,
//       balanceEur: summary.balance_eur,

//       // ── Refs (Le Corail specific, harmless for others) ──
//       accommodationRefId,
//       servicesRefId,

//       accommodationDetails: accommodationRows,
//       cityTaxDetails: cityTaxRows,
//       stampTaxDetails: stampTaxRows,
//       otherServices: otherServicesArray,

//       // ── Status / notes ──
//       status: formData.status || 'pending',
//       note: formData.note || '',
//     },
//   };
// };