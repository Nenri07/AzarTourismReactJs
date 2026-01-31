
// import axios from 'axios';

// class InvoiceApi {
//     constructor() {
       
//         this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        
        
//         this.axios = axios.create({
//             baseURL: this.baseURL,
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             }
//         });
        
//         // Store active requests for cancellation
//         this.activeRequests = new Map();
//     }
    
   
    
//     async request(config, requestId = null) {
        
//         const controller = new AbortController();
        
        
//         const reqId = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        
//         this.activeRequests.set(reqId, controller);
        
//         try {
//             const response = await this.axios({
//                 ...config,
//                 signal: controller.signal
//             });
            
//             this.activeRequests.delete(reqId);
            
            
//             return response.data.data || response.data;
            
//         } catch (error) {
            
//             this.activeRequests.delete(reqId);
            
            
//             if (axios.isCancel(error)) {
//                 console.log('Request cancelled:', reqId);
//                 return null;
//             }
            
          
//             throw error.response?.data || error.message;
//         }
//     }
    
   
    
//     cancelRequest(requestId) {
//         const controller = this.activeRequests.get(requestId);
//         if (controller) {
//             controller.abort();
//             this.activeRequests.delete(requestId);
//             return true;
//         }
//         return false;
//     }
    
//     cancelAllRequests() {
//         this.activeRequests.forEach(controller => controller.abort());
//         this.activeRequests.clear();
//         console.log('All pending requests cancelled');
//     }
    
    
//     getAllRecords(requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: '/records/all'
//         }, requestId);
//     }
    
   
//     getInvoices(filters = {}, requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: '/invoices',
//             params: filters
//         }, requestId);
//     }
    
   
//     getInvoice(id, requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: `/invoices/${id}`
//         }, requestId);
//     }
    
    
//     getCompleteInvoice(id, requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: `/invoices/${id}/complete`
//         }, requestId);
//     }

//     async downloadPdf(invoicePayload, requestId = null) {
//     return this.request({
//         method: 'POST',
//         url: '/generate-pdf-direct',
//         data: {
//             invoice: invoicePayload // ✅ REQUIRED
//         },
//         responseType: 'blob',
//     }, requestId);
// }

    
    
// async createInvoice(data, requestId = null) {
//   try {
//     const response = await this.request({
//       method: 'POST',
//       url: '/invoices',
//       data: data
//     }, requestId);
    
//     return response;
//   } catch (error) {
    
//     if (error.response?.data) {

//       throw error.response.data;
//     }
//     throw error;
//   }
// }
    
    
//     updateInvoice(id, data, requestId = null) {
//         return this.request({
//             method: 'PUT',
//             url: `/invoices/${id}`,
//             data: data
//         }, requestId);
//     }
    
   
//     updateCompleteInvoice(id, data, requestId = null) {
//         return this.request({
//             method: 'PUT',
//             url: `/updateinvoices/${id}`,
//             data: data
//         }, requestId);
//     }
    
    
//     deleteInvoice(id, requestId = null) {
//         return this.request({
//             method: 'DELETE',
//             url: `/invoices/${id}`
//         }, requestId);
//     }
    
//     // Search by name
//     searchByName(searchTerm, limit = 50, requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: '/invoices/search/name',
//             params: {
//                 search_term: searchTerm,
//                 limit: limit
//             }
//         }, requestId);
//     }
    
//     // Search by date
//     searchByDate(startDate, endDate, dateField = 'invoice_date', requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: '/invoices/search/date',
//             params: {
//                 start_date: startDate,
//                 end_date: endDate,
//                 date_field: dateField
//             }
//         }, requestId);
//     }
    
   
//     getStats(requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: '/stats'
//         }, requestId);
//     }
    
  
//     healthCheck(requestId = null) {
//         return this.request({
//             method: 'GET',
//             url: '/health'
//         }, requestId);
//     }
// }


// export default new InvoiceApi();


import axios from 'axios';

class InvoiceApi {
  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Automatically add Bearer token to all requests (except login/register)
    this.axios.interceptors.request.use(
      (config) => {
        const publicEndpoints = ['/auth/login', '/auth/register', '/health'];
        const isPublic = publicEndpoints.some((endpoint) =>
          config.url?.includes(endpoint)
        );

        if (!isPublic) {
          const token = localStorage.getItem('accessToken'); 
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle 401 → auto logout (optional refresh logic later)
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          // Optional: redirect to login
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // Cancellation support
    this.activeRequests = new Map();
  }

  // Core request method with cancellation
  async request(config, requestId = null) {
    const controller = new AbortController();
    const reqId = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.activeRequests.set(reqId, controller);

    try {
      const response = await this.axios({
        ...config,
        signal: controller.signal,
      });

      this.activeRequests.delete(reqId);
      return response.data.data || response.data;
    } catch (error) {
      this.activeRequests.delete(reqId);

      if (axios.isCancel(error)) {
        console.log('Request cancelled:', reqId);
        return null;
      }

      throw error.response?.data || error.message;
    }
  }

  // Cancellation helpers
  cancelRequest(requestId) {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      return true;
    }
    return false;
  }

  cancelAllRequests() {
    this.activeRequests.forEach((controller) => controller.abort());
    this.activeRequests.clear();
    console.log('All pending requests cancelled');
  }

  // ── Invoice Endpoints ───────────────────────────────────────────────

  getAllRecords(requestId = null) {
    return this.request({ method: 'GET', url: '/records/all' }, requestId);
  }

  getInvoices(filters = {}, requestId = null) {
    return this.request({ method: 'GET', url: '/invoices', params: filters }, requestId);
  }

  getInvoice(id, requestId = null) {
    return this.request({ method: 'GET', url: `/invoices/${id}` }, requestId);
  }

  getCompleteInvoice(id, requestId = null) {
    return this.request({ method: 'GET', url: `/invoices/${id}/complete` }, requestId);
  }

  async downloadPdf(invoicePayload, requestId = null) {
    return this.request(
      {
        method: 'POST',
        url: '/generate-pdf-direct',
        data: { invoice: invoicePayload },
        responseType: 'blob',
      },
      requestId
    );
  }

  async createInvoice(data, requestId = null) {
    try {
      return await this.request({ method: 'POST', url: '/invoices', data }, requestId);
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  updateInvoice(id, data, requestId = null) {
    return this.request({ method: 'PUT', url: `/invoices/${id}`, data }, requestId);
  }

  updateCompleteInvoice(id, data, requestId = null) {
    return this.request({ method: 'PUT', url: `/updateinvoices/${id}`, data }, requestId);
  }

  deleteInvoice(id, requestId = null) {
    return this.request({ method: 'DELETE', url: `/invoices/${id}` }, requestId);
  }

  searchByName(searchTerm, limit = 50, requestId = null) {
    return this.request(
      {
        method: 'GET',
        url: '/invoices/search/name',
        params: { search_term: searchTerm, limit },
      },
      requestId
    );
  }

  searchByDate(startDate, endDate, dateField = 'invoice_date', requestId = null) {
    return this.request(
      {
        method: 'GET',
        url: '/invoices/search/date',
        params: { start_date: startDate, end_date: endDate, date_field: dateField },
      },
      requestId
    );
  }

  getStats(requestId = null) {
    return this.request({ method: 'GET', url: '/stats' }, requestId);
  }

  healthCheck(requestId = null) {
    return this.request({ method: 'GET', url: '/health' }, requestId);
  }
}

export default new InvoiceApi();