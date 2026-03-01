import axios from 'axios';

class CairoInvoiceAPI {
  constructor() {
    // Use the same base URL pattern, targeting the egypt-invoices endpoint
    const baseURL = import.meta.env.VITE_BACKEND_URL;
    this.baseURL = `${baseURL}/egypt-invoices`;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for debugging and consistent response handling
    this.axiosInstance.interceptors.response.use(
      response => {
        console.log('✅ Cairo Invoice API Response:', {
          url: response.config.url,
          method: response.config.method,
          data: response.data,
          status: response.status
        });
        return response.data;
      },
      error => {
        console.error('❌ Cairo Invoice API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          error: error.response?.data || error.message
        });
        throw error;
      }
    );

    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      config => {
        console.log('🌐 Cairo Invoice API Request:', {
          fullURL: `${this.baseURL}${config.url}`,
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data
        });
        return config;
      },
      error => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Get all Egypt invoices
  async getAllInvoices() {
    try {
      const response = await this.axiosInstance.get('/');
      
      // Handle different response structures
      if (response && response.data && Array.isArray(response.data)) {
        return { data: response.data, count: response.data.length };
      } else if (Array.isArray(response)) {
        return { data: response, count: response.length };
      } else if (response && typeof response === 'object') {
        return response;
      }
      
      return { data: [], count: 0 };
    } catch (error) {
      console.error('❌ Error fetching Cairo invoices:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId) {
    try {
      const response = await this.axiosInstance.get(`/${invoiceId}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching Cairo invoice:', error);
      throw error;
    }
  }

  // Create a new Egypt invoice
  async createInvoice(invoiceData) {
    try {
      console.log('📤 Creating Cairo invoice:', invoiceData);
      const response = await this.axiosInstance.post('/', invoiceData);
      console.log('✅ Cairo invoice created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating Cairo invoice:', error.response?.data || error);
      throw error;
    }
  }

  // Update invoice
  async updateInvoice(invoiceId, invoiceData) {
    try {
      console.log('📤 Updating Cairo invoice:', invoiceId, invoiceData);
      const response = await this.axiosInstance.put(`/${invoiceId}`, invoiceData);
      console.log('✅ Cairo invoice updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating Cairo invoice:', error.response?.data || error);
      throw error;
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId) {
    try {
      const response = await this.axiosInstance.delete(`/${invoiceId}`);
      console.log('✅ Cairo invoice deleted');
      return response;
    } catch (error) {
      console.error('❌ Error deleting Cairo invoice:', error);
      throw error;
    }
  }
}

export default new CairoInvoiceAPI();
