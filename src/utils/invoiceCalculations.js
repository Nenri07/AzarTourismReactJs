const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

/**
 * Detect hotel type from config
 */
export const detectHotelType = (hotelConfig) => {
  const name = hotelConfig?.hotel_name?.toLowerCase() || '';
  
  if (name.includes('grand') && name.includes('aras')) {
    return 'GRAND_ARAS';
  } else if (name.includes('tryp')) {
    return 'TRYP'; // TRYP uses same calculations as Grand Aras
  } else if (name.includes('cvk') || name.includes('bosphorus')) {
    return 'CVK';
  }
  
  // Default to CVK structure if unknown
  return 'CVK';
};

/**
 * Calculate accommodation details based on hotel type
 */
export const calculateAccommodation = (formData, hotelType) => {
  const acc = formData.accommodation_details || {};
  
  const eurAmount = parseNum(acc.eur_amount, 4);
  const exchangeRate = parseNum(acc.exchange_rate, 4);
  const totalNights = parseInt(acc.total_nights) || 0;
  
  if (eurAmount === 0 || exchangeRate === 0 || totalNights === 0) {
    return {
      eurAmount: 0,
      exchangeRate: 0,
      totalNights: 0,
      roomAmountTry: 0,
      totalRoomAllNights: 0,
      taxableAmount: 0,
      vat10Percent: 0,
      accommodationTax: 0,
      totalPerNight: 0,
      vatTotalNights: 0,
      accTaxTotalNights: 0
    };
  }
  
  if (hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') {
    // Grand Aras & TRYP Calculations (same logic)
    // a = EUR Amount × Exchange Rate
    const roomAmountTry = parseNum(eurAmount * exchangeRate);
    
    // b = Total Nights × a
    const totalRoomAllNights = parseNum(roomAmountTry * totalNights);
    
    // d = b ÷ 1.12
    const taxableAmount = parseNum(totalRoomAllNights / 1.12);
    
    // g = d × 0.10
    const vat10Percent = parseNum(taxableAmount * 0.1);
    
    // j = d × 0.02
    const accommodationTax = parseNum(taxableAmount * 0.02);
    
    return {
      eurAmount,
      exchangeRate,
      totalNights,
      roomAmountTry,
      totalRoomAllNights,
      taxableAmount, // This is 'd' - total taxable for all nights
      vat10Percent, // This is 'g' - VAT 10% on total
      accommodationTax, // This is 'j' - Acc tax on total
      // For consistency
      totalPerNight: totalRoomAllNights,
      vatTotalNights: vat10Percent,
      accTaxTotalNights: accommodationTax
    };
  } else {
    // CVK Calculations
    // Per night calculation
    const roomAmountTry = parseNum(eurAmount * exchangeRate);
    const taxableAmountPerNight = parseNum(roomAmountTry / 1.12);
    const vat10PercentPerNight = parseNum(taxableAmountPerNight * 0.1);
    const accommodationTaxPerNight = parseNum(taxableAmountPerNight * 0.02);
    
    // Total for all nights
    const totalPerNight = parseNum(taxableAmountPerNight * totalNights);
    const vatTotalNights = parseNum(vat10PercentPerNight * totalNights);
    const accTaxTotalNights = parseNum(accommodationTaxPerNight * totalNights);
    
    return {
      eurAmount,
      exchangeRate,
      totalNights,
      roomAmountTry,
      taxableAmount: taxableAmountPerNight, // Per night for CVK
      vat10Percent: vat10PercentPerNight,
      accommodationTax: accommodationTaxPerNight,
      totalPerNight,
      vatTotalNights,
      accTaxTotalNights
    };
  }
};

/**
 * Calculate other services (laundry, etc.) - 20% VAT
 * This is the SAME for both hotels
 */
export const calculateServices = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return {
      services: [],
      totalGross: 0,
      totalTaxable: 0,
      totalVat20: 0
    };
  }
  
  const calculatedServices = services.map(service => {
    const grossAmount = parseNum(service.gross_amount);
    
    if (grossAmount === 0) {
      return {
        ...service,
        taxable_amount: 0,
        vat_20_percent: 0
      };
    }
    
    // e = c ÷ 1.2
    const taxableAmount = parseNum(grossAmount / 1.2);
    
    // h = e × 0.20
    const vat20Percent = parseNum(taxableAmount * 0.2);
    
    return {
      ...service,
      taxable_amount: taxableAmount,
      vat_20_percent: vat20Percent
    };
  });
  
  const totalGross = calculatedServices.reduce((sum, s) => sum + parseNum(s.gross_amount), 0);
  const totalTaxable = calculatedServices.reduce((sum, s) => sum + parseNum(s.taxable_amount), 0);
  const totalVat20 = calculatedServices.reduce((sum, s) => sum + parseNum(s.vat_20_percent), 0);
  
  return {
    services: calculatedServices,
    totalGross: parseNum(totalGross),
    totalTaxable: parseNum(totalTaxable),
    totalVat20: parseNum(totalVat20)
  };
};

/**
 * Calculate final summary based on hotel type
 */
export const calculateFinalSummary = (formData, hotelType) => {
  // Calculate accommodation
  const accCalc = calculateAccommodation(formData, hotelType);
  
  // Calculate services
  const servicesCalc = calculateServices(formData.other_services);
  
  if (hotelType === 'GRAND_ARAS' || hotelType === 'TRYP') {
    // Grand Aras & TRYP Summary (same calculation logic)
    // d = taxable amount (room) - already calculated
    const totalTaxableRoom = accCalc.taxableAmount;
    
    // c = Total laundry gross amount
    const totalLaundryGross = servicesCalc.totalGross;
    
    // e = Total laundry taxable
    const totalLaundryTaxable = servicesCalc.totalTaxable;
    
    // g = VAT 10% (room)
    const totalVat10 = accCalc.vat10Percent;
    
    // h = VAT 20% (services)
    const totalVat20 = servicesCalc.totalVat20;
    
    // f = d + e (total taxable)
    const totalTaxable = parseNum(totalTaxableRoom + totalLaundryTaxable);
    
    // i = g + h (total VAT)
    const totalVat = parseNum(totalVat10 + totalVat20);
    
    // j = accommodation tax
    const totalAccTax = accCalc.accommodationTax;
    
    // k = f + i + j (grand total)
    const grandTotal = parseNum(totalTaxable + totalVat + totalAccTax);
    
    // m = k ÷ exchange_rate (total in EUR)
    const totalInEur = accCalc.exchangeRate > 0 
      ? parseNum(grandTotal / accCalc.exchangeRate) 
      : 0;
    
    return {
      // Base values
      total_taxable_amount_room: totalTaxableRoom, // d
      total_laundry_amount: totalLaundryGross, // c
      total_laundry_taxable: totalLaundryTaxable, // e
      
      // VAT breakdown
      total_vat_10: totalVat10, // g
      total_vat_20: totalVat20, // h - THIS WAS MISSING!
      total_vat: totalVat, // i
      
      // Taxes
      total_accommodation_tax: totalAccTax, // j
      
      // Totals
      total_taxable_amount: totalTaxable, // f
      grand_total: grandTotal, // k
      total_in_eur: totalInEur, // m
      
      // For backend compatibility
      total_amount: accCalc.totalRoomAllNights,
      total_including_vat_kdv_dahil: grandTotal
    };
  } else {
    // CVK Summary
    const accTotal = accCalc.totalPerNight;
    const accVat = accCalc.vatTotalNights;
    const accTax = accCalc.accTaxTotalNights;
    
    const servicesTotal = servicesCalc.totalTaxable;
    const servicesVat = servicesCalc.totalVat20;
    
    const totalAmount = parseNum(accTotal + servicesTotal);
    const totalVat = parseNum(accVat + servicesVat);
    const totalIncludingVat = parseNum(totalAmount + totalVat + accTax);
    const totalInEur = accCalc.exchangeRate > 0 
      ? parseNum(totalIncludingVat / accCalc.exchangeRate) 
      : 0;
    
    return {
      total_amount: totalAmount,
      total_vat_10: totalVat,
      total_vat_20: servicesVat, // Add this explicitly
      total_acc_tax: accTax,
      total_including_vat_kdv_dahil: totalIncludingVat,
      total_in_eur: totalInEur,
      
      // Additional CVK-specific fields
      total_vat_hesaplanan_kdv: totalVat,
      taxable_amount_kdv_matrah: totalAmount,
      
      // For compatibility
      grand_total: totalIncludingVat
    };
  }
};

/**
 * Map form data to backend schema (universal for all hotels)
 */
export const mapToBackendSchema = (formData, hotelConfig) => {
  // Detect hotel type
  const hotelType = detectHotelType(hotelConfig);
  const isTrypOrGrandAras = (hotelType === 'TRYP' || hotelType === 'GRAND_ARAS');
  
  // Calculate everything
  const accCalc = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);
  const summary = calculateFinalSummary(formData, hotelType);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    return dateStr.split("T")[0];
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
  
  // Build accommodation details array
  const accommodationDetailsArray = [];
  const arrivalDate = new Date(formData.arrival_date);
  
  for (let i = 0; i < accCalc.totalNights; i++) {
    const currentDate = new Date(arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    accommodationDetailsArray.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0],
      description: 'Hébergement / Accommodation',
      rate: isTrypOrGrandAras
        ? accCalc.roomAmountTry // For Grand Aras & TRYP, use room amount in TRY
        : accCalc.taxableAmount // For CVK, use taxable amount per night
    });
  }
  
  // Build services array
  const otherServicesArray = servicesCalc.services.map(service => ({
    name: capitalizeWords(service.service_name) || 'Service',
    amount: service.gross_amount || 0,
    taxable_amount: service.taxable_amount || 0,
    vat_20_percent: service.vat_20_percent || 0,
    date: formatDate(service.service_date || formData.invoice_date)
  }));
  
  // Return universal backend schema
  return {
    data: {
      // Basic info
      hotel: formData.hotel_name,
      guestName: capitalizeWords(formData.guest_name) || 'Guest',
      roomNo: formData.room_number || '',
      voucherNo: formData.cash_no || '',
      passportNo: formData.passport_no || '',
      confirmation: formData.passport_no || '',
      vNo: formData.folio_number || '',
      referenceNo: formData.company_name || `INV-${Date.now()}`,
      userId: formData.user_code || '',
      batchNo: formData.page_number || '1',
      invoiceDate: formatDate(formData.invoice_date),
      arrivalDate: formatDate(formData.arrival_date),
      departureDate: formatDate(formData.departure_date),
      paxAdult: parseInt(formData.adults) || 1,
      paxChild: parseInt(formData.children) || 0,
      
      // Accommodation calculations
      nights: accCalc.totalNights,
      actualRate: accCalc.eurAmount,
      exchangeRate: accCalc.exchangeRate,
      sellingRate: accCalc.roomAmountTry,
      
      // Taxable amounts (store both formats for compatibility)
      taxable_amount: accCalc.taxableAmount,
      taxable_amount_room: accCalc.taxableAmount,
      
      // Room totals
      subTotal: isTrypOrGrandAras
        ? accCalc.totalRoomAllNights 
        : accCalc.totalPerNight,
      total_per_night: accCalc.totalPerNight,
      total_room_all_nights: accCalc.totalRoomAllNights,
      room_amount_try: accCalc.roomAmountTry,
      
      // VAT calculations
      vat1_10: accCalc.vat10Percent,
      vat_10_percent: accCalc.vat10Percent,
      vat7: accCalc.vatTotalNights,
      vat_total_nights: accCalc.vatTotalNights,
      vat20: servicesCalc.totalVat20, // Services VAT 20%
      vatTotal: summary.total_vat,
      
      // Accommodation tax
      accommodationTaxTotal: accCalc.accommodationTax,
      accommodation_tax: accCalc.accommodationTax,
      acc_tax_total_nights: accCalc.accTaxTotalNights,
      
      // Grand total
      grandTotal: summary.grand_total,
      
      // Arrays
      accommodationDetails: accommodationDetailsArray,
      otherServices: otherServicesArray,
      
      // Status
      status: formData.status || 'pending',
      note: formData.note || '',
      
      // Legacy fields (set to 0)
      vat5: 0,
      newVat1_10: 0,
      newVat7: 0,
      newVat20: 0,
      newVat5: 0,
      cityTaxRows: 0,
      cityTaxAmount: 0,
      stampTaxRows: 0,
      stampTaxAmount: 0,
      stampTaxTotal: 0,
      cityTaxTotal: 0,
      cityTaxDetails: [],
      stampTaxDetails: []
    }
  };
};
