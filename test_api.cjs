// const axios = require('axios');
// axios.get('https://azar-backend-code-final.onrender.com/api/hotel-info/')
//   .then(res => {
//     const response = res.data;
//     let hotelsList = [];
//     if (response && Array.isArray(response.data)) {
//       hotelsList = response.data;
//     } else if (Array.isArray(response)) {
//       hotelsList = response;
//     }
    
//     console.log("HotelsList length:", hotelsList.length);
//     if(hotelsList.length > 0) {
//       console.log("First item:", hotelsList[0].country);
//     }
    
//     const transformedHotels = hotelsList.map((config) => ({
//       id: config.id,
//       name: config.hotel_name,
//       code: config.currency || "TRY",
//       currency: config.currency || "TRY",
//       country: config.country || "Turkey",
//     }));
    
//     const availableCountries = [...new Set(transformedHotels.map(h => (h.country || "").trim()).filter(Boolean))].sort();
//     console.log("availableCountries:", availableCountries);
//   })
//   .catch(err => console.error(err.message));
