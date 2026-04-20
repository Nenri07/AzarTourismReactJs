import axios from 'axios';

class TunisiaInvoiceAPI {
  constructor() {
    const baseURL = import.meta.env.VITE_BACKEND_URL;
    this.baseURL = `${baseURL}/tounis-invoices`;

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.axiosInstance.interceptors.response.use(
      response => {
        console.log('✅ Tunisia Invoice API Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data,
        });
        return response.data;
      },
      error => {
        console.error('❌ Tunisia Invoice API Error:', {
          url: error.config?.url,
          error: error.response?.data || error.message,
        });
        throw error;
      }
    );

    this.axiosInstance.interceptors.request.use(
      config => {
        console.log('🌐 Tunisia Invoice API Request:', {
          fullURL: `${this.baseURL}${config.url}`,
          method: config.method?.toUpperCase(),
          data: config.data,
        });
        return config;
      },
      error => Promise.reject(error)
    );
  }

  async getAllInvoices() {
    try {
      const response = await this.axiosInstance.get('/');
      if (Array.isArray(response?.data)) return { data: response.data, count: response.data.length };
      if (Array.isArray(response))       return { data: response, count: response.length };
      return response || { data: [], count: 0 };
    } catch (err) {
      console.error('❌ Error fetching Tunisia invoices:', err);
      throw err;
    }
  }

  async getInvoiceById(invoiceId) {
    try {
      return await this.axiosInstance.get(`/${invoiceId}`);
    } catch (err) {
      console.error('❌ Error fetching Tunisia invoice:', err);
      throw err;
    }
  }

  async createInvoice(invoiceData) {
    try {
      console.log('📤 Creating Tunisia invoice:', invoiceData);
      const response = await this.axiosInstance.post('/', invoiceData);
      console.log('✅ Tunisia invoice created:', response);
      return response;
    } catch (err) {
      console.error('❌ Error creating Tunisia invoice:', err.response?.data || err);
      throw err;
    }
  }

  async updateInvoice(invoiceId, invoiceData) {
    try {
      console.log('📤 Updating Tunisia invoice:', invoiceId, invoiceData);
      const response = await this.axiosInstance.put(`/${invoiceId}`, invoiceData);
      console.log('✅ Tunisia invoice updated:', response);
      return response;
    } catch (err) {
      console.error('❌ Error updating Tunisia invoice:', err.response?.data || err);
      throw err;
    }
  }

  async deleteInvoice(invoiceId) {
    try {
      const response = await this.axiosInstance.delete(`/${invoiceId}`);
      console.log('✅ Tunisia invoice deleted');
      return response;
    } catch (err) {
      console.error('❌ Error deleting Tunisia invoice:', err);
      throw err;
    }
  }
}

export default new TunisiaInvoiceAPI();