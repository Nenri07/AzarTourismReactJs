const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

class DynamicInvoiceApi {
 
  async createInvoice(invoiceData) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/dynamic-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return { 
      //   success: true, 
      //   id: Date.now(), 
      //   invoice_number: `INV-${Date.now()}`,
      //   ...invoiceData 
      // };
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Update existing invoice
   * @param {number|string} id - Invoice ID
   * @param {Object} invoiceData - Updated invoice data
   * @returns {Promise<Object>}
   */
  async updateInvoice(id, invoiceData) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/dynamic-invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return { success: true, id, ...invoiceData };
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   * @param {number|string} id - Invoice ID
   * @returns {Promise<Object>}
   */
  async getInvoice(id) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/dynamic-invoices/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return {
      //   id,
      //   invoice_number: `INV-${id}`,
      //   hotel_name: 'Novotel Tunis Lac',
      //   currency: 'EUR',
      //   form_data: {
      //     company_name: 'Sample Company',
      //     guest_name: 'John Doe',
      //     arrival_date: '2025-01-20',
      //     departure_date: '2025-01-25',
      //   },
      //   calculated_values: {
      //     grand_total: '1500.000',
      //   },
      //   status: 'pending',
      //   created_at: '2025-01-20T10:00:00Z',
      // };
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices (with optional filters)
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>}
   */
  async getAllInvoices(filters = {}) {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${API_BASE_URL}/api/dynamic-invoices${queryParams ? `?${queryParams}` : ''}`;

      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return {
      //   invoices: [
      //     {
      //       id: 1,
      //       invoice_number: 'INV-001',
      //       hotel_name: 'Novotel Tunis Lac',
      //       guest_name: 'John Doe',
      //       grand_total: '1500.000',
      //       currency: 'EUR',
      //       status: 'pending',
      //       created_at: '2025-01-20T10:00:00Z',
      //     },
      //   ],
      //   total: 1,
      // };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Delete invoice
   * @param {number|string} id - Invoice ID
   * @returns {Promise<Object>}
   */
  async deleteInvoice(id) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/dynamic-invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return { success: true, id };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Search invoices by guest name, hotel name, or invoice number
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  async searchInvoices(searchTerm) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(
        `${API_BASE_URL}/api/dynamic-invoices/search?q=${encodeURIComponent(searchTerm)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return {
      //   results: [
      //     {
      //       id: 1,
      //       invoice_number: 'INV-001',
      //       hotel_name: 'Novotel Tunis Lac',
      //       guest_name: 'John Doe',
      //       grand_total: '1500.000',
      //       currency: 'EUR',
      //       status: 'pending',
      //     },
      //   ],
      // };
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }

  /**
   * Update invoice status
   * @param {number|string} id - Invoice ID
   * @param {string} status - New status (pending, confirmed, paid, cancelled)
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/dynamic-invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

      // DUMMY RESPONSE (remove after implementing backend)
      // return { success: true, id, status };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }

  /**
   * Generate PDF for invoice
   * @param {number|string} id - Invoice ID
   * @returns {Promise<Blob>}
   */
  async generatePDF(id) {
    try {
      // TODO: Replace with actual FastAPI endpoint
      const response = await fetch(`${API_BASE_URL}/api/dynamic-invoices/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();

      // DUMMY RESPONSE (remove after implementing backend)
      // return new Blob(['PDF content'], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

export default new DynamicInvoiceApi();