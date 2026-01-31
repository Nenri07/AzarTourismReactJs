// // src/utils/sessionManager.js
// // Advanced Session Manager with Form Auto-Save Protection

// class SessionManager {
//   constructor(options = {}) {
//     this.inactivityTimeout = options.inactivityTimeout || 5 * 60 * 1000; // 5 minutes
//     this.warningTime = options.warningTime || 1 * 60 * 1000; // 1 minute warning
//     this.checkInterval = options.checkInterval || 1000;
//     this.onLogout = options.onLogout || (() => {});
//     this.onWarning = options.onWarning || (() => {});
//     this.onAutoSave = options.onAutoSave || (() => {});
    
//     this.lastActivity = Date.now();
//     this.timer = null;
//     this.warningShown = false;
//     this.isActive = true;
//     this.hasUnsavedChanges = false;
    
//     this.init();
//   }
  
//   init() {
//     this.trackActivity();
//     this.startInactivityCheck();
//     this.handleTabClose();
//     this.syncAcrossTabs();
//     this.setupAutoSave();
//   }
  
//   // Track user activity
//   trackActivity() {
//     const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
//     events.forEach(event => {
//       document.addEventListener(event, () => this.updateActivity(), { passive: true });
//     });
//   }
  
//   updateActivity() {
//     this.lastActivity = Date.now();
//     this.warningShown = false;
//     localStorage.setItem('lastActivity', this.lastActivity.toString());
//   }
  
//   // Check for inactivity
//   startInactivityCheck() {
//     this.timer = setInterval(() => {
//       const now = Date.now();
//       const inactiveTime = now - this.lastActivity;
      
//       // Trigger auto-save before showing warning
//       if (inactiveTime >= (this.inactivityTimeout - this.warningTime - 10000) && this.hasUnsavedChanges) {
//         this.onAutoSave();
//       }
      
//       // Show warning
//       if (inactiveTime >= (this.inactivityTimeout - this.warningTime) && !this.warningShown) {
//         this.warningShown = true;
//         const remainingTime = Math.ceil((this.inactivityTimeout - inactiveTime) / 1000);
//         this.onWarning(remainingTime);
//       }
      
//       // Auto logout
//       if (inactiveTime >= this.inactivityTimeout) {
//         this.logout('inactivity');
//       }
//     }, this.checkInterval);
//   }
  
//   // Handle tab/window close
//   handleTabClose() {
//     window.addEventListener('beforeunload', (e) => {
//       // Auto-save if there are unsaved changes
//       if (this.hasUnsavedChanges) {
//         this.onAutoSave();
//       }
      
//       // Check if last tab
//       const tabCount = parseInt(sessionStorage.getItem('tabCount') || '0');
      
//       if (tabCount <= 1) {
//         // Last tab - trigger logout
//         this.logout('tab_close');
//       }
//     });
    
//     // Track active tabs
//     let tabCount = parseInt(sessionStorage.getItem('tabCount') || '0');
//     tabCount++;
//     sessionStorage.setItem('tabCount', tabCount.toString());
    
//     window.addEventListener('unload', () => {
//       let count = parseInt(sessionStorage.getItem('tabCount') || '0');
//       count = Math.max(0, count - 1);
//       sessionStorage.setItem('tabCount', count.toString());
//     });
//   }
  
//   // Sync logout across tabs
//   syncAcrossTabs() {
//     window.addEventListener('storage', (e) => {
//       if (e.key === 'logout_event') {
//         this.logout('other_tab');
//       }
      
//       if (e.key === 'lastActivity') {
//         const lastActivity = parseInt(e.newValue || '0');
//         if (lastActivity > this.lastActivity) {
//           this.lastActivity = lastActivity;
//           this.warningShown = false;
//         }
//       }
//     });
//   }
  
//   // Auto-save system
//   setupAutoSave() {
//     // Auto-save every 30 seconds if there are changes
//     setInterval(() => {
//       if (this.hasUnsavedChanges) {
//         this.onAutoSave();
//       }
//     }, 30000); // 30 seconds
//   }
  
//   // Set unsaved changes flag
//   setUnsavedChanges(hasChanges) {
//     this.hasUnsavedChanges = hasChanges;
//   }
  
//   // Extend session (when user clicks "Stay logged in")
//   extendSession() {
//     this.updateActivity();
//     this.warningShown = false;
//   }
  
//   // Logout function
//   logout(reason) {
//     if (!this.isActive) return;
    
//     this.isActive = false;
    
//     // Clear timer
//     if (this.timer) {
//       clearInterval(this.timer);
//     }
    
//     // Clear localStorage
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('userData');
//     localStorage.removeItem('lastActivity');
    
//     // Notify other tabs
//     localStorage.setItem('logout_event', Date.now().toString());
//     localStorage.removeItem('logout_event');
    
//     // Call logout callback
//     this.onLogout(reason);
//   }
  
//   destroy() {
//     if (this.timer) {
//       clearInterval(this.timer);
//     }
//   }
// }

// export default SessionManager;


// ============================================
// FORM AUTO-SAVE HOOK
// ============================================

// src/hooks/useFormAutoSave.js


// ============================================
// USAGE IN YOUR APP
// ============================================

// src/App.jsx - Initialize Session Manager
/*
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from './store/authSlice';
import { useNavigate } from 'react-router-dom';
import SessionManager from './utils/sessionManager';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sessionManager, setSessionManager] = useState(null);

  useEffect(() => {
    const manager = new SessionManager({
      inactivityTimeout: 5 * 60 * 1000, // 5 minutes
      warningTime: 1 * 60 * 1000, // 1 minute warning
      
      onWarning: (remainingSeconds) => {
        setCountdown(remainingSeconds);
        setShowWarning(true);
      },
      
      onLogout: (reason) => {
        console.log('Logged out:', reason);
        dispatch(logout());
        navigate('/login', { 
          state: { message: 'Session expired due to inactivity' } 
        });
      },
      
      onAutoSave: () => {
        // This will be called before logout to save any form data
        console.log('Auto-saving form data...');
      }
    });

    setSessionManager(manager);

    // Cleanup
    return () => manager.destroy();
  }, [dispatch, navigate]);

  return (
    <>
      {showWarning && (
        <SessionWarningModal
          countdown={countdown}
          onStayLoggedIn={() => {
            sessionManager?.extendSession();
            setShowWarning(false);
          }}
          onLogout={() => sessionManager?.logout('manual')}
        />
      )}
      
      <YourAppContent sessionManager={sessionManager} />
    </>
  );
}
*/


// ============================================
// USAGE IN INVOICE FORM
// ============================================

// src/pages/InvoiceFormPage.jsx
/*
import { useState, useEffect } from 'react';
import { useFormAutoSave } from '../hooks/useFormAutoSave';

function InvoiceFormPage({ sessionManager }) {
  const [formData, setFormData] = useState({});
  const { savedFormData, clearSavedData } = useFormAutoSave(
    formData, 
    'invoice_form',
    sessionManager
  );
  
  // Restore saved data on mount
  useEffect(() => {
    if (savedFormData) {
      const shouldRestore = window.confirm(
        'We found an unsaved invoice draft. Would you like to restore it?'
      );
      
      if (shouldRestore) {
        setFormData(savedFormData);
      } else {
        clearSavedData();
      }
    }
  }, [savedFormData, clearSavedData]);
  
  // Handle form submission
  const handleSubmit = async (data) => {
    try {
      await saveInvoice(data);
      clearSavedData(); // Clear draft after successful save
      sessionManager?.setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save invoice');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields *\/}
    </form>
  );
}
*/


// src/utils/sessionManager.js
// class SessionManager {
//   constructor(options = {}) {
//     this.inactivityTimeout = options.inactivityTimeout || 10 * 60 * 1000; // 10 minutes
//     this.warningTime = options.warningTime || 2 * 60 * 1000; // 2 minutes warning
//     this.checkInterval = options.checkInterval || 1000;
//     this.onLogout = options.onLogout || (() => {});
//     this.onWarning = options.onWarning || (() => {});
//     this.onAutoSave = options.onAutoSave || (() => {});
//     this.onActivity = options.onActivity || (() => {}); // NEW: Activity callback
    
//     this.lastActivity = Date.now();
//     this.timer = null;
//     this.warningShown = false;
//     this.isActive = true;
//     this.hasUnsavedChanges = false;
//     this.activityThreshold = 30000; // Refresh token every 30 seconds of activity
//     this.lastTokenRefresh = Date.now();
    
//     this.init();
//   }
  
//   init() {
//     this.trackActivity();
//     this.startInactivityCheck();
//     this.handleTabClose();
//     this.syncAcrossTabs();
//   }
  
//   trackActivity() {
//     const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    
//     const throttledUpdate = this.throttle(() => {
//       this.updateActivity();
//     }, 1000); // Throttle to once per second
    
//     events.forEach(event => {
//       document.addEventListener(event, throttledUpdate, { passive: true });
//     });
//   }
  
//   throttle(func, limit) {
//     let inThrottle;
//     return function(...args) {
//       if (!inThrottle) {
//         func.apply(this, args);
//         inThrottle = true;
//         setTimeout(() => inThrottle = false, limit);
//       }
//     };
//   }
  
//   updateActivity() {
//     const now = Date.now();
//     this.lastActivity = now;
//     this.warningShown = false;
//     localStorage.setItem('lastActivity', this.lastActivity.toString());
    
//     // NEW: Trigger activity callback for token refresh
//     if (now - this.lastTokenRefresh >= this.activityThreshold) {
//       this.lastTokenRefresh = now;
//       this.onActivity(); // Call token refresh
//     }
//   }
  
//   startInactivityCheck() {
//     this.timer = setInterval(() => {
//       const now = Date.now();
//       const inactiveTime = now - this.lastActivity;
      
//       // Auto-save before warning
//       if (inactiveTime >= (this.inactivityTimeout - this.warningTime - 10000) && this.hasUnsavedChanges) {
//         this.onAutoSave();
//       }
      
//       // Show warning
//       if (inactiveTime >= (this.inactivityTimeout - this.warningTime) && !this.warningShown) {
//         this.warningShown = true;
//         const remainingTime = Math.ceil((this.inactivityTimeout - inactiveTime) / 1000);
//         this.onWarning(remainingTime);
//       }
      
//       // Auto logout
//       if (inactiveTime >= this.inactivityTimeout) {
//         this.logout('inactivity');
//       }
//     }, this.checkInterval);
//   }
  
//   handleTabClose() {
//     window.addEventListener('beforeunload', (e) => {
//       if (this.hasUnsavedChanges) {
//         this.onAutoSave();
//       }
//     });
//   }
  
//   syncAcrossTabs() {
//     window.addEventListener('storage', (e) => {
//       if (e.key === 'logout_event') {
//         this.logout('other_tab');
//       }
      
//       if (e.key === 'lastActivity') {
//         const lastActivity = parseInt(e.newValue || '0');
//         if (lastActivity > this.lastActivity) {
//           this.lastActivity = lastActivity;
//           this.warningShown = false;
//         }
//       }
//     });
//   }
  
//   setUnsavedChanges(hasChanges) {
//     this.hasUnsavedChanges = hasChanges;
//   }
  
//   extendSession() {
//     this.updateActivity();
//     this.warningShown = false;
//     this.onActivity(); // Refresh token when extending
//   }
  
//   logout(reason) {
//     if (!this.isActive) return;
    
//     this.isActive = false;
    
//     if (this.timer) {
//       clearInterval(this.timer);
//     }
    
//     localStorage.removeItem('accessToken');
//     localStorage.removeItem('userData');
//     localStorage.removeItem('lastActivity');
    
//     localStorage.setItem('logout_event', Date.now().toString());
//     localStorage.removeItem('logout_event');
    
//     this.onLogout(reason);
//   }
  
//   destroy() {
//     if (this.timer) {
//       clearInterval(this.timer);
//     }
//   }
// }

// export default SessionManager;




// src/utils/sessionManager.js
class SessionManager {
  constructor(options = {}) {
    this.inactivityTimeout = options.inactivityTimeout || 10 * 60 * 1000;
    this.warningTime = options.warningTime || 2 * 60 * 1000;
    this.checkInterval = options.checkInterval || 1000;
    this.onLogout = options.onLogout || (() => {});
    this.onWarning = options.onWarning || (() => {});
    this.onAutoSave = options.onAutoSave || (() => {});
    this.onActivity = options.onActivity || (() => {});
    
    this.lastActivity = Date.now();
    this.timer = null;
    this.warningShown = false;
    this.isActive = true;
    this.hasUnsavedChanges = false;
    this.activityThreshold = 30000;
    this.lastTokenRefresh = Date.now();
    
    this.init();
  }
  
  init() {
    // Initialize lastActivity from localStorage if available
    const savedActivity = localStorage.getItem('lastActivity');
    if (savedActivity) {
      this.lastActivity = parseInt(savedActivity);
    }
    
    this.trackActivity();
    this.startInactivityCheck();
    this.handleTabClose();
    this.syncAcrossTabs();
  }
  
  trackActivity() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    
    const throttledUpdate = this.throttle(() => {
      this.updateActivity();
    }, 1000);
    
    events.forEach(event => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });
  }
  
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  updateActivity() {
    const now = Date.now();
    this.lastActivity = now;
    this.warningShown = false;
    localStorage.setItem('lastActivity', now.toString());
    
    if (now - this.lastTokenRefresh >= this.activityThreshold) {
      this.lastTokenRefresh = now;
      this.onActivity();
    }
  }
  
  startInactivityCheck() {
    console.log('⏱️ SessionManager started - timeout:', this.inactivityTimeout / 1000 / 60, 'minutes');
    
    this.timer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - this.lastActivity;
      
      if (inactiveTime >= (this.inactivityTimeout - this.warningTime - 10000) && this.hasUnsavedChanges) {
        this.onAutoSave();
      }
      
      if (inactiveTime >= (this.inactivityTimeout - this.warningTime) && !this.warningShown) {
        this.warningShown = true;
        const remainingTime = Math.ceil((this.inactivityTimeout - inactiveTime) / 1000);
        this.onWarning(remainingTime);
      }
      
      if (inactiveTime >= this.inactivityTimeout) {
        console.log('⏰ Inactivity timeout reached - logging out');
        this.logout('inactivity');
      }
    }, this.checkInterval);
  }
  
  handleTabClose() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        this.onAutoSave();
      }
    });
  }
  
  syncAcrossTabs() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'logout_event') {
        console.log('🔄 Logout from other tab detected');
        this.logout('other_tab');
      }
      
      if (e.key === 'lastActivity') {
        const lastActivity = parseInt(e.newValue || '0');
        if (lastActivity > this.lastActivity) {
          this.lastActivity = lastActivity;
          this.warningShown = false;
        }
      }
    });
  }
  
  setUnsavedChanges(hasChanges) {
    this.hasUnsavedChanges = hasChanges;
  }
  
  extendSession() {
    console.log('🔄 Session extended by user');
    this.updateActivity();
    this.warningShown = false;
    this.onActivity();
  }
  
  logout(reason) {
    if (!this.isActive) return;
    
    console.log('🚪 SessionManager logout triggered:', reason);
    this.isActive = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Clear ALL session data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('lastActivity');
    
    // Notify other tabs
    localStorage.setItem('logout_event', Date.now().toString());
    setTimeout(() => localStorage.removeItem('logout_event'), 100);
    
    // Call callback
    this.onLogout(reason);
  }
  
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    console.log('🧹 SessionManager destroyed');
  }
}

export default SessionManager;
