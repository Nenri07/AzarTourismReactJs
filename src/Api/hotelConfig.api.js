// import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// apiClient.interceptors.request.use(
//   (config) => {
//     console.log('🌐 API Request:', {
//       method: config.method.toUpperCase(),
//       url: config.url,
//       fullURL: `${config.baseURL}${config.url}`,
//       data: config.data
//     });
//     return config;
//   },
//   (error) => {
//     console.error('❌ Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// apiClient.interceptors.response.use(
//   (response) => {
//     console.log('✅ API Response:', {
//       status: response.status,
//       url: response.config.url,
//       data: response.data
//     });
//     return response.data;
//   },
//   (error) => {
//     console.error('❌ API Error:', {
//       status: error.response?.status,
//       url: error.config?.url,
//       data: error.response?.data
//     });
    
//     let errorMessage = 'An error occurred';
    
//     if (error.response?.data) {
//       const data = error.response.data;
      
//       if (Array.isArray(data.detail)) {
//         errorMessage = data.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
//       } else if (typeof data.detail === 'string') {
//         errorMessage = data.detail;
//       } else if (data.message) {
//         errorMessage = data.message;
//       } else {
//         errorMessage = error.message;
//       }
//     } else {
//       errorMessage = error.message;
//     }
    
//     throw new Error(errorMessage);
//   }
// );

// export const getHotelConfigs = async () => {
//   return await apiClient.get('/hotel-info/');
// };


// export const getallInvoices = async () => {
//   return await apiClient.get('/dashboard/');
// };

// export const getHotelConfigByName = async (hotelName) => {
//   return await apiClient.get(`/hotel-info/by-hotel/${encodeURIComponent(hotelName)}`);
// };

// export const getHotelConfigById = async (invoiceId) => {
//   return await apiClient.get(`/hotel-info/${invoiceId}`);
// };

// export const createHotelConfig = async (configData) => {
//   return await apiClient.post('/hotel-info/', configData);
// };

// export const updateHotelConfig = async (invoiceId, configData) => {
//   console.log('🔄 Update API call - ID:', invoiceId, 'Type:', typeof invoiceId);
//   return await apiClient.put(`/hotel-info/${invoiceId}`, configData);
// };

// export const deleteHotelConfig = async (invoiceId) => {
//   console.log('🗑️ Delete API call - ID:', invoiceId, 'Type:', typeof invoiceId);
//   return await apiClient.delete(`/hotel-info/${invoiceId}`);
// };

// export default {
//   getHotelConfigs,
//   getHotelConfigByName,
//   getHotelConfigById,
//   createHotelConfig,
//   updateHotelConfig,
//   deleteHotelConfig,
//   getallInvoices
// };



import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    let errorMessage = 'An error occurred';
    if (error.response?.data) {
      const data = error.response.data;
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
      } else if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (data.message) {
        errorMessage = data.message;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
);
// Paginated - no country filter
export const getHotelConfigsPaginated = async (page = 1, limit = 10) => {
  return await apiClient.get(`/hotel-info/paginated?page=${page}&limit=${limit}`);
};

// Paginated + country filter
export const getHotelsByCountryPaginated = async (country, page = 1, limit = 10) => {
  return await apiClient.get(
    `/hotel-info/by-country?country=${encodeURIComponent(country)}&page=${page}&limit=${limit}`
  );
};

export const getHotelConfigs = async () => {
  return await apiClient.get('/hotel-info/');
};

export const getallInvoices = async () => {
  return await apiClient.get('/dashboard/');
};

export const getHotelConfigByName = async (hotelName) => {
  return await apiClient.get(`/hotel-info/by-hotel/${encodeURIComponent(hotelName)}`);
};

export const getHotelConfigById = async (invoiceId) => {
  return await apiClient.get(`/hotel-info/${invoiceId}`);
};

// ✅ NEW: Get all countries (no params)
export const getCountries = async () => {
  return await apiClient.get('/hotel-info/countries');
};

// ✅ NEW: Get hotels filtered by country
export const getHotelsByCountry = async (country) => {
  return await apiClient.get(`/hotel-info/by-country?country=${encodeURIComponent(country)}`);
};

export const createHotelConfig = async (configData) => {
  return await apiClient.post('/hotel-info/', configData);
};

export const updateHotelConfig = async (invoiceId, configData) => {
  console.log('🔄 Update API call - ID:', invoiceId, 'Type:', typeof invoiceId);
  return await apiClient.put(`/hotel-info/${invoiceId}`, configData);
};

export const deleteHotelConfig = async (invoiceId) => {
  console.log('🗑️ Delete API call - ID:', invoiceId, 'Type:', typeof invoiceId);
  return await apiClient.delete(`/hotel-info/${invoiceId}`);
};

export default {
  getHotelConfigs,
  getHotelConfigByName,
  getHotelConfigById,
  getCountries,
  getHotelsByCountry,
  getHotelConfigsPaginated,
  getHotelsByCountryPaginated,
  createHotelConfig,
  updateHotelConfig,
  deleteHotelConfig,
  getallInvoices
};