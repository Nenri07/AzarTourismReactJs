
import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';

export const useFormAutoSave = (formData, formKey, sessionManager) => {
  const [hasDraft, setHasDraft] = useState(false);
  const savedDataRef = useRef(null);
  const isInitialMount = useRef(true);
  
  // Auto-save to localStorage
  const saveFormData = debounce((data) => {
    try {
      localStorage.setItem(`form_draft_${formKey}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('✅ Form auto-saved');
      setHasDraft(true);
      sessionManager?.setUnsavedChanges(true);
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, 1500); // Save 1.5 seconds after user stops typing
  
  // Load saved form data on mount
  useEffect(() => {
    if (isInitialMount.current) {
      try {
        const saved = localStorage.getItem(`form_draft_${formKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only restore if less than 24 hours old
          if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            savedDataRef.current = parsed.data;
            setHasDraft(true);
            console.log('📂 Found saved draft');
          } else {
            // Remove old draft
            localStorage.removeItem(`form_draft_${formKey}`);
            setHasDraft(false);
          }
        }
      } catch (error) {
        console.error('Failed to load saved form:', error);
      }
      isInitialMount.current = false;
    }
  }, [formKey]);
  
  // Save when form data changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0 && !isInitialMount.current) {
      saveFormData(formData);
    }
  }, [formData, saveFormData]);
  
  // Clear saved data
  const clearSavedData = () => {
    localStorage.removeItem(`form_draft_${formKey}`);
    setHasDraft(false);
    sessionManager?.setUnsavedChanges(false);
    console.log('🧹 Draft cleared');
  };
  
  // Mark as restored
  const markAsRestored = () => {
    // Mark that we've restored this draft
    localStorage.setItem(`draft_restored_${formKey}`, Date.now().toString());
    // Clear the draft after restoring
    clearSavedData();
    console.log('🔧 Draft marked as restored');
  };
  
  // Load saved form data (manual)
  const loadSavedFormData = () => {
    try {
      const saved = localStorage.getItem(`form_draft_${formKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.error('Failed to load saved form:', error);
    }
    return null;
  };
  
  return {
    savedFormData: savedDataRef.current,
    hasDraft,
    clearSavedData,
    markAsRestored,
    loadSavedFormData
  };
};
