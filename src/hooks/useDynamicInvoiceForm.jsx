import { useState, useEffect } from 'react';
import { useDynamicCalculations } from './useDynamicCalculations';

export const useDynamicInvoiceForm = (hotelConfig, initialData = {}) => {
  const [formData, setFormData] = useState({});
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form data from hotel config
  useEffect(() => {
    if (!hotelConfig) return;

    const initialFormData = { ...initialData };

    // Initialize form fields
    hotelConfig.form_fields?.forEach(field => {
      if (!(field.field_id in initialFormData)) {
        initialFormData[field.field_id] = field.default || '';
      }
    });

    // Initialize conditional sections
    const sections = hotelConfig.conditional_sections || {};
    
    // Accommodation fields
    if (sections.accommodation_details?.enabled) {
      sections.accommodation_details.fields.forEach(field => {
        if (!(field.field_id in initialFormData) && !field.auto_calculated) {
          initialFormData[field.field_id] = field.default || field.fixed_value || '';
        }
      });
    }

    // City tax fields
    if (sections.city_tax?.enabled) {
      sections.city_tax.fields.forEach(field => {
        if (!(field.field_id in initialFormData) && !field.auto_calculated) {
          initialFormData[field.field_id] = field.default || '';
        }
      });
    }

    // Stamp tax fields
    if (sections.stamp_tax?.enabled) {
      sections.stamp_tax.fields.forEach(field => {
        if (!(field.field_id in initialFormData)) {
          initialFormData[field.field_id] = field.default || field.fixed_value || '';
        }
      });
    }

    // Initialize other services array
    if (sections.other_services?.enabled) {
      if (!initialFormData.other_services) {
        initialFormData.other_services = [];
      }
    }

    setFormData(initialFormData);
  }, [hotelConfig, initialData]);

  // Get calculated values
  const calculatedValues = useDynamicCalculations(hotelConfig, formData);

  // Validate dates
  useEffect(() => {
    const arrivalField = hotelConfig?.form_fields?.find(f => f.field_id === 'arrival_date');
    const departureField = hotelConfig?.form_fields?.find(f => f.field_id === 'departure_date');

    if (arrivalField && departureField) {
      const arrival = formData[arrivalField.field_id];
      const departure = formData[departureField.field_id];

      if (arrival && departure) {
        const arrivalDate = new Date(arrival);
        const departureDate = new Date(departure);

        if (departureDate < arrivalDate) {
          setDateError('Departure date cannot be before arrival date');
        } else {
          setDateError('');
        }
      }
    }
  }, [formData, hotelConfig]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleServiceChange = (index, fieldId, value) => {
    setFormData(prev => {
      const services = [...(prev.other_services || [])];
      services[index] = {
        ...services[index],
        [fieldId]: value,
      };
      return {
        ...prev,
        other_services: services,
      };
    });
  };

  const addService = () => {
    setFormData(prev => {
      const sections = hotelConfig?.conditional_sections || {};
      const serviceFields = sections.other_services?.fields || [];
      
      const newService = {};
      serviceFields.forEach(field => {
        newService[field.field_id] = field.default || '';
      });
      newService.id = Date.now();

      return {
        ...prev,
        other_services: [...(prev.other_services || []), newService],
      };
    });
  };

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      other_services: (prev.other_services || []).filter((_, i) => i !== index),
    }));
  };

  return {
    formData,
    setFormData,
    calculatedValues,
    handleInputChange,
    handleServiceChange,
    addService,
    removeService,
    dateError,
    loading,
    setLoading,
  };
};

