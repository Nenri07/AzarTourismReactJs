import React, { useState, useEffect, useCallback } from 'react';
import { Save, Edit2, Trash2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { getHotelConfigs, createHotelConfig, updateHotelConfig, deleteHotelConfig } from '../Api/hotelConfig.api';

const SAMPLE_HOTEL_CONFIG = {
  "hotel_name": "Novotel Tunis Lac",
  "currency": "TRY",
  "country": "Tunis",
  "form_fields": [
    {"field_id": "company_name", "label": "Company Name", "data_type": "string", "required": true, "max_length": 100, "example": "Azar Tourism Services"},
    {"field_id": "address", "label": "Company Address", "data_type": "string", "required": true, "max_length": 200, "example": "Algeria Square Building Tripoli Libyan Arab Jamal"},
    {"field_id": "account_number", "label": "Account Number", "data_type": "string", "required": true, "max_length": 20, "example": "ARZ2022TOU"},
    {"field_id": "vat_number", "label": "VAT Number", "data_type": "string", "required": false, "max_length": 20, "example": ""},
    {"field_id": "invoice_number", "label": "Invoice Number", "data_type": "string", "required": true, "max_length": 20, "example": "49569"},
    {"field_id": "cashier_id", "label": "Cashier ID", "data_type": "string", "required": true, "max_length": 10, "example": "6820"},
    {"field_id": "guest_name", "label": "Guest Name", "data_type": "string", "required": true, "max_length": 100, "example": "Mr. Muflah Zaid"},
    {"field_id": "room_number", "label": "Room Number", "data_type": "string", "required": true, "max_length": 10, "example": "207"},
    {"field_id": "arrival_date", "label": "Arrival Date", "data_type": "date", "format": "DD/MM/YY", "required": true, "example": "22/12/25"},
    {"field_id": "departure_date", "label": "Departure Date", "data_type": "date", "format": "DD/MM/YY", "required": true, "example": "29/12/25"},
    {"field_id": "location", "label": "Location", "data_type": "string", "required": true, "max_length": 50, "example": "Tunis Lac"}
  ],
  "conditional_sections": {
    "accommodation_details": {
      "enabled": true,
      "object_name": "accommodation",
      "fields": [
        {"field_id": "total_nights", "label": "Total Nights", "data_type": "integer", "auto_calculated": true, "calculation": "departure_date - arrival_date", "example": 7},
        {"field_id": "room_rate", "label": "Room Rate per Night", "data_type": "decimal", "required": true, "example": 150.00, "currency": "TRY"},
        {"field_id": "room_type", "label": "Room Type", "data_type": "string", "required": false, "example": "Standard", "options": ["Standard", "Deluxe", "Suite", "Executive"]},
        {"field_id": "board_basis", "label": "Board Basis", "data_type": "string", "required": false, "example": "Room Only", "options": ["Room Only", "Bed & Breakfast", "Half Board", "Full Board"]}
      ],
      "calculation_rules": {"subtotal": "room_rate * total_nights", "vat_rate": 10, "vat_amount": "subtotal * vat_rate / 100"}
    },
    "city_tax": {
      "enabled": false,
      "object_name": "city_tax",
      "fields": [
        {"field_id": "city_tax_rate", "label": "City Tax Rate", "data_type": "decimal", "required": true, "example": 1.5, "unit": "per night per person"},
        {"field_id": "city_tax_nights", "label": "Nights for City Tax", "data_type": "integer", "auto_calculated": true, "calculation": "total_nights", "example": 7},
        {"field_id": "city_tax_persons", "label": "Persons for City Tax", "data_type": "integer", "required": true, "example": 1}
      ],
      "calculation_rules": {"city_tax_amount": "city_tax_rate * city_tax_nights * city_tax_persons"}
    },
    "stamp_tax": {
      "enabled": true,
      "object_name": "stamp_tax",
      "fields": [
        {"field_id": "stamp_tax_amount", "label": "Stamp Tax Amount", "data_type": "decimal", "required": true, "fixed_value": 5.00, "example": 5.00, "note": "One time charge"}
      ]
    },
    "other_services": {
      "enabled": true,
      "object_name": "other_services",
      "multiple_entries": true,
      "max_entries": 100,
      "fields": [
        {"field_id": "service_name", "label": "Service Name", "data_type": "string", "required": true, "max_length": 100, "example": "Airport Transfer"},
        {"field_id": "service_date", "label": "Service Date", "data_type": "date", "format": "DD/MM/YYYY", "required": true, "example": "22/12/25"},
        {"field_id": "service_amount", "label": "Amount", "data_type": "decimal", "required": true, "example": 50.00},
        {"field_id": "service_taxable", "label": "Taxable", "data_type": "boolean", "required": false, "default": true, "example": true}
      ]
    }
  },
  "final_calculations": {
    "subtotal_accommodation": "accommodation.subtotal",
    "subtotal_services": "SUM(other_services.service_amount)",
    "total_subtotal": "subtotal_accommodation + subtotal_services",
    "total_tax": "accommodation.vat_amount + city_tax.city_tax_amount + stamp_tax.stamp_tax_amount",
    "grand_total": "total_subtotal + total_tax"
  }
}

const CURRENCIES = ['EUR', 'TRY', 'EGP', 'USD', 'AED', 'GBP', 'SAR', 'QAR', 'OMR', 'KWD', 'BHD'];
const COUNTRIES = ['Turkey', 'Egypt', 'Tunis', 'Malaysia', 'London', 'Germany', 'Qatar', 'Bahrain', 'Oman', 'Kuwait'];

const HotelConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [hotelName, setHotelName] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [country, setCountry] = useState('Turkey');
  const [jsonConfig, setJsonConfig] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getHotelConfigs();
      console.log('Raw API response:', response);
      
      const configsArray = response.data || [];
      console.log('Configs array:', configsArray);
      
      setConfigs(configsArray);
    } catch (err) {
      setError('Failed to load configurations: ' + err.message);
      console.error('Load error:', err);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleJSON = useCallback(() => {
    setJsonConfig(JSON.stringify(SAMPLE_HOTEL_CONFIG, null, 2));
    setSuccess('Sample template loaded');
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  const validateJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.hotel_name || !parsed.currency || !parsed.country) {
        return 'Missing hotel_name, currency or country';
      }
      if (!Array.isArray(parsed.form_fields)) {
        return 'form_fields must be an array';
      }
      if (!parsed.conditional_sections || typeof parsed.conditional_sections !== 'object') {
        return 'Invalid conditional_sections';
      }
      if (!parsed.final_calculations || typeof parsed.final_calculations !== 'object') {
        return 'Invalid final_calculations';
      }
      
      return null;
    } catch (e) {
      return `Invalid JSON: ${e.message}`;
    }
  };

  const updateJsonField = useCallback((field, value) => {
    if (!jsonConfig) return;
    
    try {
      const parsed = JSON.parse(jsonConfig);
      parsed[field] = value;
      setJsonConfig(JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.warn('Could not update JSON field:', err);
    }
  }, [jsonConfig]);

  const handleHotelNameChange = useCallback((e) => {
    const newName = e.target.value;
    setHotelName(newName);
    updateJsonField('hotel_name', newName);
  }, [updateJsonField]);

  const handleCurrencyChange = useCallback((e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    updateJsonField('currency', newCurrency);
  }, [updateJsonField]);

    const handleCountryChange = useCallback((e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    updateJsonField('country', newCountry);
  }, [updateJsonField]);

  const handleSave = async () => {

    console.log("this is country name", country);
    
    setError('');
    setSuccess('');

    if (!hotelName.trim()) {
      setError('Hotel name is required');
      return;
    }

    if (!jsonConfig.trim()) {
      setError('JSON configuration is required');
      return;
    }

    const validationError = validateJSON(jsonConfig);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const parsedConfig = JSON.parse(jsonConfig);

      // Force top-level fields to match the UI states to ensure they are saved
      parsedConfig.hotel_name = hotelName;
      parsedConfig.currency = currency;
      parsedConfig.country = country;

      if (editingId) {
        await updateHotelConfig(editingId, parsedConfig);
        setSuccess('Configuration updated successfully');
      } else {
        await createHotelConfig(parsedConfig);
        setSuccess('Configuration saved successfully');
      }

      await loadConfigs();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = useCallback((config) => {
    if (!config.id) {
      setError('Cannot edit: Invalid configuration ID');
      return;
    }

    setEditingId(config.id);
    setHotelName(config.hotel_name);
    setCurrency(config.currency);
    setCountry(config.country || 'Turkey');
    
    const { id, created_at, ...configData } = config;
    setJsonConfig(JSON.stringify(configData, null, 2));
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDelete = async (config) => {
    if (!config.id) {
      setError('Cannot delete: Invalid configuration ID');
      return;
    }

    if (!window.confirm(`Delete configuration for "${config.hotel_name}"?`)) {
      return;
    }

    try {
      setError('');
      await deleteHotelConfig(config.id);
      setSuccess('Configuration deleted successfully');
      await loadConfigs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete: ' + err.message);
      console.error('Delete error:', err);
    }
  };

  const resetForm = useCallback(() => {
    setEditingId(null);
    setHotelName('');
    setCurrency('TRY');
    setCountry('Turkey');
    setJsonConfig('');
    setError('');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Hotel Configuration Management
          </h1>
          <p className="text-slate-600">
            Configure hotel invoice templates with JSON
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {editingId ? `Edit Configuration (ID: ${editingId})` : 'Create Configuration'}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hotel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={hotelName}
                onChange={handleHotelNameChange}
                placeholder="e.g., Novotel Tunis Lac"
                className="w-full h-12 px-4 text-base text-slate-900 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={currency}
                onChange={handleCurrencyChange}
                className="w-full h-12 px-4 text-base text-slate-900 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={country}
                onChange={handleCountryChange}
                className="w-full h-12 px-4 text-base text-slate-900 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  JSON Configuration <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={loadSampleJSON}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border-2 border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Load Sample
                </button>
              </div>
              <textarea
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
                placeholder="Paste your hotel configuration JSON here..."
                rows={20}
                className="w-full min-h-[500px] p-4 text-sm text-slate-900 bg-white border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono leading-relaxed"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 text-base font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: saving ? '#6b7280' : '#002a5c', minHeight: '48px' }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#001a3c')}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#002a5c')}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingId ? 'Update' : 'Save'}
                  </>
                )}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-3 text-base font-medium text-slate-700 bg-slate-200 border-2 border-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                  style={{ minHeight: '48px' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            Saved Configurations ({configs.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-4 rounded-full animate-spin" 
                   style={{ borderTopColor: '#002a5c' }}>
              </div>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-4">No configurations saved yet</p>
              <p className="text-sm text-slate-400">Create your first configuration above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        {config.hotel_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>
                          Currency: <span className="font-medium text-slate-700">{config.currency}</span>
                        </span>
                        <span>
                          Country: <span className="font-medium text-slate-700">{config.country}</span>
                        </span>
                        <span>
                          ID: <span className="font-mono font-medium text-slate-700">{config.id}</span>
                        </span>
                        {config.created_at && (
                          <span>Created: {new Date(config.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#003d7a' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#002a5c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003d7a'}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(config)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelConfigPage;
