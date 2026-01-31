import axios from 'axios';

class TurkeyInvoiceAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URLs;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Create a new Turkey invoice
  async createInvoice(invoiceData) {
    try {
      console.log('📤 Creating Turkey invoice:', invoiceData);
      const response = await this.axiosInstance.post('/', invoiceData);
      console.log('✅ Turkey invoice created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating Turkey invoice:', error.response?.data || error);
      throw error;
    }
  }

  // Get all Turkey invoices
  async getAllInvoices() {
    try {
      const response = await this.axiosInstance.get('/');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching Turkey invoices:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId) {
    try {
      const response = await this.axiosInstance.get(`/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching Turkey invoice:', error);
      throw error;
    }
  }

  // Update invoice
  async updateInvoice(invoiceId, invoiceData) {
    try {
      console.log('📤 Updating Turkey invoice:', invoiceId, invoiceData);
      const response = await this.axiosInstance.put(`/${invoiceId}`, invoiceData);
      console.log('✅ Turkey invoice updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating Turkey invoice:', error.response?.data || error);
      throw error;
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId) {
    try {
      const response = await this.axiosInstance.delete(`/${invoiceId}`);
      console.log('✅ Turkey invoice deleted');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting Turkey invoice:', error);
      throw error;
    }
  }
}

export default new TurkeyInvoiceAPI();
