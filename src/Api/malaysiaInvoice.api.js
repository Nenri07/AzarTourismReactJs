import axios from 'axios';

class MalaysiaInvoiceAPI {
  constructor() {
    const baseURL = import.meta.env.VITE_BACKEND_URL;
    this.baseURL = `${baseURL}/malaysia-invoices`;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for debugging and consistent response handling
    this.axiosInstance.interceptors.response.use(
      response => {
        console.log('✅ Malaysia Invoice API Response:', {
          url: response.config.url,
          method: response.config.method,
          data: response.data,
          status: response.status
        });
        return response.data;
      },
      error => {
        console.error('❌ Malaysia Invoice API Error:', {
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
      console.error('❌ Error fetching malaysia invoices:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId) {
    try {
      const response = await this.axiosInstance.get(`/${invoiceId}`);
      return response;
    } catch (error) {
      console.error('❌ Error fetching malaysia invoice:', error);
      throw error;
    }
  }

  // Create a new malaysia invoice
  async createInvoice(invoiceData) {
    try {
      console.log('📤 Creating malaysia invoice:', invoiceData);
      const response = await this.axiosInstance.post('/', invoiceData);
      console.log('✅ malaysia invoice created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating malaysia invoice:', error.response?.data || error);
      throw error;
    }
  }

  // Update invoice
  async updateInvoice(invoiceId, invoiceData) {
    try {
      console.log('📤 Updating malaysia invoice:', invoiceId, invoiceData);
      const response = await this.axiosInstance.put(`/${invoiceId}`, invoiceData);
      console.log('✅ malaysia invoice updated:', response);
      return response;
    } catch (error) {
      console.error('❌ Error updating malaysia invoice:', error.response?.data || error);
      throw error;
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId) {
    try {
      const response = await this.axiosInstance.delete(`/${invoiceId}`);
      console.log('✅ malaysia invoice deleted');
      return response;
    } catch (error) {
      console.error('❌ Error deleting malaysia invoice:', error);
      throw error;
    }
  }
}

export default new MalaysiaInvoiceAPI();
