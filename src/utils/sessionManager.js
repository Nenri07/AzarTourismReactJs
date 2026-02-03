
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
