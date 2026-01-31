import { useEffect, useRef } from 'react';
import { debounce } from 'lodash'; // or implement your own debounce

export const useFormAutoSave = (formData, formKey, sessionManager) => {
  const savedDataRef = useRef(null);
  
  // Auto-save to localStorage
  const saveFormData = debounce((data) => {
    try {
      localStorage.setItem(`form_draft_${formKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('✅ Form auto-saved');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, 1000); // Save 1 second after user stops typing
  
  // Load saved form data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`form_draft_${formKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only restore if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          savedDataRef.current = parsed.data;
        } else {
          // Remove old draft
          localStorage.removeItem(`form_draft_${formKey}`);
        }
      }
    } catch (error) {
      console.error('Failed to load saved form:', error);
    }
  }, [formKey]);
  
  // Save when form data changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      saveFormData(formData);
      sessionManager?.setUnsavedChanges(true);
    }
  }, [formData, saveFormData, sessionManager]);
  
  // Clear saved data
  const clearSavedData = () => {
    localStorage.removeItem(`form_draft_${formKey}`);
    sessionManager?.setUnsavedChanges(false);
  };
  
  return {
    savedFormData: savedDataRef.current,
    clearSavedData
  };
};
