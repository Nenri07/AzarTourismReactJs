/**
 * Safely parse a number value - ONLY for final display rounding
 */
export const parseNum = (value, decimals = 2) => {
  const num = parseFloat(value || 0);
  return isNaN(num) ? 0 : Number(num.toFixed(decimals));
};

export const detectHotelType = (hotelConfig) => {
  const name = hotelConfig?.hotel_name?.toLowerCase() || '';
  if (name.includes('staybridge') && name.includes('cairo')) {
    return 'STAY_BRIDGE';
  }
  return 'OTHER_EGYPT';
};

export const calculateAccommodation = (formData, hotelType) => {
  const acc = formData.accommodation_details || {};
  
  const usdAmount = parseFloat(acc.usd_amount || acc.dollar_amount || 0);
  const exchangeRate = parseFloat(acc.exchange_rate || 0);
  const totalNights = parseInt(acc.total_nights) || 0;
  
  if (usdAmount === 0 || exchangeRate === 0 || totalNights === 0) {
    return { usdAmount: 0, exchangeRate: 0, totalNights: 0, roomAmountEgp: 0, totalRoomAllNights: 0 };
  }

  let roomAmountEgp = 0;

  if (hotelType === 'STAY_BRIDGE') {
    // Staybridge: Divide USD by rate to get EGP
    roomAmountEgp = usdAmount / exchangeRate;
  } else {
    // Other Egypt Hotels: Multiply USD by rate to get EGP
    roomAmountEgp = usdAmount * exchangeRate;
  }
  
  const updateRoomAmountEgp = roomAmountEgp.toFixed(2);
  const totalRoomAllNights = updateRoomAmountEgp * totalNights;

  return {
    usdAmount, // Keep unrounded internally
    exchangeRate,
    totalNights,
    roomAmountEgp,
    totalRoomAllNights
  };
};

export const calculateServices = (services = []) => {
  if (!Array.isArray(services) || services.length === 0) {
    return { services: [], totalServicesGross: 0 };
  }
  
  const totalServicesGross = services.reduce((sum, service) => {
    return sum + parseFloat(service.gross_amount || 0);
  }, 0);
  
  return { services, totalServicesGross };
};

export const calculateFinalSummary = (formData, hotelType) => {
  const accCalc = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);
  
  // 1. The Combined Pot using highly precise internal floats
  const grandTotalEgp = accCalc.totalRoomAllNights + servicesCalc.totalServicesGross;
  
  let baseTaxableAmount = 0, serviceCharge = 0, cityTax = 0, vat14Percent = 0, balanceUsd = 0;

  if (grandTotalEgp > 0) {
    // 2. Extract Base using exact divisor (1.12 * 1.01 * 1.14 = 1.289568)
    baseTaxableAmount = grandTotalEgp / 1.289568;
    
    // 3. Step-by-step Egyptian Taxes using exact floats
    serviceCharge = baseTaxableAmount * 0.12;
    const basePlusSc = baseTaxableAmount + serviceCharge;
    
    cityTax = basePlusSc * 0.01;
    const basePlusScPlusCt = basePlusSc + cityTax;

    vat14Percent = basePlusScPlusCt * 0.14;
    
    // 4. Calculate USD Balance
    if (accCalc.exchangeRate > 0) {
      if (hotelType === 'STAY_BRIDGE') {
        balanceUsd = grandTotalEgp * accCalc.exchangeRate;
      } else {
        balanceUsd = grandTotalEgp / accCalc.exchangeRate;
      }
    }
  }

  // 5. Apply formatting ONLY at the final output step to prevent 10-20 point drift
  return {
    total_taxable_amount: parseNum(baseTaxableAmount),
    total_service_charge: parseNum(serviceCharge),
    total_city_tax: parseNum(cityTax),
    total_vat_14: parseNum(vat14Percent),
    grand_total_egp: parseNum(grandTotalEgp),
    balance_usd: parseNum(balanceUsd),
    grand_total: parseNum(grandTotalEgp) 
  };
};

export const mapToBackendSchema = (formData, hotelConfig) => {
  const hotelType = detectHotelType(hotelConfig);
  const accCalc = calculateAccommodation(formData, hotelType);
  const servicesCalc = calculateServices(formData.other_services);
  const summary = calculateFinalSummary(formData, hotelType);
  
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split("T")[0];
    return dateStr.split("T")[0];
  };
  
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str.trim().replace(/\s+/g, " ").split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  
  const accommodationDetailsArray = [];
  const arrivalDate = new Date(formData.arrival_date);
  
  for (let i = 0; i < accCalc.totalNights; i++) {
    const currentDate = new Date(arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    accommodationDetailsArray.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0],
      description: 'Accommodation',
      rate: parseNum(accCalc.roomAmountEgp) 
    });
  }
  
  const otherServicesArray = servicesCalc.services.map(service => ({
    name: capitalizeWords(service.service_name) || 'Service',
    amount: parseFloat(service.gross_amount || 0),
    date: formatDate(service.service_date || formData.invoice_date)
  }));
  
  return {
    data: {
      hotel: formData.hotel_name || '',
      invoiceNo: formData.invoice_no || '',
      guestName: capitalizeWords(formData.guest_name) || 'Guest',
      address: formData.address || 'Algeria Square Building Number 12 First Floor, Tripoli, Libya',
      companyName: formData.company_name || 'Azar Tourism Services',
      referenceNo: formData.reference_no || '',
      arNumber: formData.ar_number || '',
      roomNo: formData.room_number || '',
      arrivalDate: formatDate(formData.arrival_date),
      departureDate: formatDate(formData.departure_date),
      invoiceDate: formatDate(formData.invoice_date),
      invoiceTime: formData.invoice_time || '',
      cashierId: formData.cashier_id || '',
      ihgRewardsNumber: formData.ihg_rewards_number || '',
      status: formData.status || 'pending',
      note: formData.note || '',
      
      nights: accCalc.totalNights,
      usdAmount: parseNum(accCalc.usdAmount),
      exchangeRate: parseNum(accCalc.exchangeRate, 7),
      roomAmountEgp: parseNum(accCalc.roomAmountEgp),
      
      totalRoomGrossEgp: parseNum(accCalc.totalRoomAllNights),
      totalServicesGrossEgp: parseNum(servicesCalc.totalServicesGross),
      baseTaxableAmount: summary.total_taxable_amount,
      serviceCharge: summary.total_service_charge,
      cityTax: summary.total_city_tax,
      vat14Percent: summary.total_vat_14,
      grandTotalEgp: summary.grand_total_egp,
      balanceUsd: summary.balance_usd,
      
      accommodationDetails: accommodationDetailsArray,
      otherServices: otherServicesArray
    }
  };
};



// /**
//  * Safely parse a number value
//  */
// export const parseNum = (value, decimals = 2) => {
//   const num = parseFloat(value || 0);
//   return isNaN(num) ? 0 : Number(num.toFixed(decimals));
// };

// /**
//  * Exact calculator rounding to 2 decimal places
//  */
// const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// export const detectHotelType = (hotelConfig) => {
//   const name = hotelConfig?.hotel_name?.toLowerCase() || '';
//   if (name.includes('staybridge') || name.includes('cairo')) {
//     return 'STAY_BRIDGE';
//   }
//   return 'OTHER_EGYPT';
// };

// export const calculateAccommodation = (formData, hotelType) => {
//   const acc = formData.accommodation_details || {};
//   const usdAmount = parseFloat(acc.usd_amount || acc.dollar_amount || 0);
//   const exchangeRate = parseFloat(acc.exchange_rate || 0);
//   const totalNights = parseInt(acc.total_nights) || 0;
  
//   if (usdAmount === 0 || exchangeRate === 0 || totalNights === 0) {
//     return { usdAmount: 0, exchangeRate: 0, totalNights: 0, roomAmountEgp: 0, totalRoomAllNights: 0 };
//   }

//   let roomAmountEgp = 0;

//   // BULLETPROOF CHECK: If hotel is Staybridge OR exchange rate is < 1 (e.g. 0.02)
//   if (hotelType === 'STAY_BRIDGE' || exchangeRate < 1) {
//     // EXACT CALCULATOR FORMULA: Invert rate to 2 decimals, then multiply
//     // Example: 1 / 0.02002 = 49.95. -> 560 * 49.95 = 27972.00
//     const activeRate = round2(1 / exchangeRate); 
//     roomAmountEgp = round2(usdAmount * activeRate); 
//   } else {
//     roomAmountEgp = round2(usdAmount * exchangeRate);
//   }
  
//   // FIXES THE "9 vs 8" ISSUE: Multiply the already-rounded daily rate by total nights
//   const totalRoomAllNights = round2(roomAmountEgp * totalNights);

//   return {
//     usdAmount, 
//     exchangeRate,
//     totalNights,
//     roomAmountEgp,
//     totalRoomAllNights
//   };
// };

// export const calculateServices = (services = []) => {
//   if (!Array.isArray(services) || services.length === 0) {
//     return { services: [], totalServicesGross: 0 };
//   }
  
//   const totalServicesGross = services.reduce((sum, service) => {
//     return sum + parseFloat(service.gross_amount || 0);
//   }, 0);
  
//   return { 
//     services, 
//     totalServicesGross: round2(totalServicesGross) 
//   };
// };

// export const calculateFinalSummary = (formData, hotelType) => {
//   const accCalc = calculateAccommodation(formData, hotelType);
//   const servicesCalc = calculateServices(formData.other_services);
  
//   // 1. Combine Room + Services
//   const grandTotalEgp = round2(accCalc.totalRoomAllNights + servicesCalc.totalServicesGross);
  
//   let baseTaxableAmount = 0, serviceCharge = 0, cityTax = 0, vat14Percent = 0, balanceUsd = 0;

//   if (grandTotalEgp > 0) {
//     // 2. Pure straightforward calculator math
//     baseTaxableAmount = round2(grandTotalEgp / 1.289568);
    
//     serviceCharge = round2(baseTaxableAmount * 0.12);
//     const basePlusSc = round2(baseTaxableAmount + serviceCharge);
    
//     cityTax = round2(basePlusSc * 0.01);
//     const basePlusScPlusCt = round2(basePlusSc + cityTax);

//     // This will perfectly hit .50 based on the room amount fixing above
//     vat14Percent = round2(basePlusScPlusCt * 0.14);
    
//     // 3. Calculator math for final USD balance
//     if (accCalc.exchangeRate > 0) {
//       if (hotelType === 'STAY_BRIDGE' || accCalc.exchangeRate < 1) {
//         balanceUsd = round2(grandTotalEgp * accCalc.exchangeRate);
//       } else {
//         balanceUsd = round2(grandTotalEgp / accCalc.exchangeRate);
//       }
//     }
//   }

//   return {
//     total_taxable_amount: baseTaxableAmount,
//     total_service_charge: serviceCharge,
//     total_city_tax: cityTax,
//     total_vat_14: vat14Percent,
//     grand_total_egp: grandTotalEgp,
//     balance_usd: balanceUsd,
//     grand_total: grandTotalEgp // For UI compatibility mapping
//   };
// };

// export const mapToBackendSchema = (formData, hotelConfig) => {
//   const hotelType = detectHotelType(hotelConfig);
//   const accCalc = calculateAccommodation(formData, hotelType);
//   const servicesCalc = calculateServices(formData.other_services);
//   const summary = calculateFinalSummary(formData, hotelType);
  
//   const formatDate = (dateStr) => {
//     if (!dateStr) return new Date().toISOString().split("T")[0];
//     return dateStr.split("T")[0];
//   };
  
//   const capitalizeWords = (str) => {
//     if (!str) return "";
//     return str.trim().replace(/\s+/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
//   };
  
//   const accommodationDetailsArray = [];
//   const arrivalDate = new Date(formData.arrival_date);
  
//   for (let i = 0; i < accCalc.totalNights; i++) {
//     const currentDate = new Date(arrivalDate);
//     currentDate.setDate(currentDate.getDate() + i);
//     accommodationDetailsArray.push({
//       day: i + 1,
//       date: currentDate.toISOString().split('T')[0],
//       description: 'Accommodation',
//       rate: accCalc.roomAmountEgp 
//     });
//   }
  
//   const otherServicesArray = servicesCalc.services.map(service => ({
//     name: capitalizeWords(service.service_name) || 'Service',
//     amount: parseFloat(service.gross_amount || 0),
//     date: formatDate(service.service_date || formData.invoice_date)
//   }));
  
//   return {
//     data: {
//       hotel: formData.hotel_name || '', invoiceNo: formData.invoice_no || '',
//       guestName: capitalizeWords(formData.guest_name) || 'Guest', address: formData.address || '',
//       companyName: formData.company_name || '', arNumber: formData.ar_number || '', roomNo: formData.room_number || '',
//       arrivalDate: formatDate(formData.arrival_date), departureDate: formatDate(formData.departure_date),
//       invoiceDate: formatDate(formData.invoice_date), invoiceTime: formData.invoice_time || '',
//       cashierId: formData.cashier_id || '', ihgRewardsNumber: formData.ihg_rewards_number || '',
//       status: formData.status || 'pending', note: formData.note || '',
      
//       nights: accCalc.totalNights, usdAmount: accCalc.usdAmount, exchangeRate: accCalc.exchangeRate,
//       roomAmountEgp: accCalc.roomAmountEgp, totalRoomGrossEgp: accCalc.totalRoomAllNights,
//       totalServicesGrossEgp: servicesCalc.totalServicesGross, baseTaxableAmount: summary.total_taxable_amount,
//       serviceCharge: summary.total_service_charge, cityTax: summary.total_city_tax,
//       vat14Percent: summary.total_vat_14, grandTotalEgp: summary.grand_total_egp, balanceUsd: summary.balance_usd,
      
//       accommodationDetails: accommodationDetailsArray, otherServices: otherServicesArray
//     }
//   };
// };