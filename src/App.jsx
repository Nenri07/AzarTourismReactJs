// "use client";

// import { useState, useEffect } from "react";
// import { Sidebar, Header } from "./components";
// import { Outlet } from "react-router-dom";

// export default function App() {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       setSidebarOpen(!mobile); // Open on desktop, closed on mobile
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   return (
//     <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
//       {/* Mobile Overlay */}
//       {isMobile && sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar - Fixed Position */}
//       <Sidebar
//         isOpen={sidebarOpen}
//         toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
//         isMobile={isMobile}
//       />

//       {/* Main Content Area - WITH PROPER MARGIN */}
//       <div
//         className={`min-h-screen transition-all duration-300 ${
//           isMobile
//             ? "ml-0" // No margin on mobile
//             : sidebarOpen
//               ? "ml-64" // 256px margin when sidebar is open
//               : "ml-20" // 80px margin when sidebar is collapsed
//         }`}
//       >
//         <Header
//           toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
//           sidebarOpen={sidebarOpen}
//           isMobile={isMobile}
//         />

//         <main className="p-4 md:p-8">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useState, useEffect } from "react";
// import { Sidebar, Header } from "./components";
// import { Outlet, useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { logout } from "./store/authSlice";
// import SessionManager from "./utils/sessionManager";
// import SessionWarningModal from "./components/SessionWarningModal";

// export default function App() {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);
//   const [showWarning, setShowWarning] = useState(false);
//   const [countdown, setCountdown] = useState(0);
//   const [sessionManager, setSessionManager] = useState(null);
  
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       setSidebarOpen(!mobile);
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Initialize Session Manager
//   useEffect(() => {
//     const manager = new SessionManager({
//       inactivityTimeout: 5 * 60 * 1000, // 5 minutes
//       warningTime: 1 * 60 * 1000, // 1 minute warning
      
//       onWarning: (remainingSeconds) => {
//         console.log('⚠️ Session warning:', remainingSeconds, 'seconds remaining');
//         setCountdown(remainingSeconds);
//         setShowWarning(true);
//       },
      
//       onLogout: (reason) => {
//         console.log('🔒 Session ended:', reason);
//         setShowWarning(false);
        
//         // Clear Redux state
//         dispatch(logout());
        
//         // Navigate to login with message
//         const messages = {
//           'inactivity': 'Your session expired due to inactivity',
//           'tab_close': 'Session ended',
//           'other_tab': 'You have been logged out',
//           'manual': 'You have been logged out'
//         };
        
//         navigate('/login', { 
//           state: { 
//             message: messages[reason] || 'You have been logged out'
//           },
//           replace: true
//         });
//       },
      
//       onAutoSave: () => {
//         console.log('💾 Auto-saving form data...');
//         // This will be triggered before logout
//       }
//     });

//     setSessionManager(manager);

//     // Cleanup on unmount
//     return () => {
//       manager.destroy();
//     };
//   }, [dispatch, navigate]);

//   const handleStayLoggedIn = () => {
//     console.log('✅ User chose to stay logged in');
//     sessionManager?.extendSession();
//     setShowWarning(false);
//   };

//   const handleLogout = () => {
//     console.log('👋 User chose to logout');
//     sessionManager?.logout('manual');
//   };

//   return (
//     <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
//       {/* Mobile Overlay */}
//       {isMobile && sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar - Fixed Position */}
//       <Sidebar
//         isOpen={sidebarOpen}
//         toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
//         isMobile={isMobile}
//       />

//       {/* Main Content Area */}
//       <div
//         className={`min-h-screen transition-all duration-300 ${
//           isMobile
//             ? "ml-0"
//             : sidebarOpen
//               ? "ml-64"
//               : "ml-20"
//         }`}
//       >
//         <Header
//           toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
//           sidebarOpen={sidebarOpen}
//           isMobile={isMobile}
//         />

//         <main className="p-4 md:p-8">
//           {/* Pass sessionManager to all child routes */}
//           <Outlet context={{ sessionManager }} />
//         </main>
//       </div>

//       {/* Session Warning Modal */}
//       <SessionWarningModal
//         isOpen={showWarning}
//         countdown={countdown}
//         onStayLoggedIn={handleStayLoggedIn}
//         onLogout={handleLogout}
//       />
//     </div>
//   );
// }


// // src/App.jsx
// "use client";

// import { useState, useEffect } from "react";
// import { Sidebar, Header } from "./components";
// import { Outlet, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { logout } from "./store/authSlice";
// import SessionManager from "./utils/sessionManager";
// import SessionWarningModal from "./components/SessionWarningModal";
// import { authService } from "./Api/auth.api";

// export default function App() {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);
//   const [showWarning, setShowWarning] = useState(false);
//   const [countdown, setCountdown] = useState(0);
//   const [sessionManager, setSessionManager] = useState(null);
  
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const accessToken = useSelector((state) => state.auth.accessToken);

//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       setSidebarOpen(!mobile);
//     };

//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Token refresh on activity
//   const handleTokenRefresh = async () => {
//     try {
//       console.log('🔄 Refreshing token on activity...');
//       // Call your refresh token endpoint
//       // const newToken = await authService.refreshToken();
//       // dispatch(refreshData({ accessToken: newToken }));
//     } catch (error) {
//       console.error('❌ Token refresh failed:', error);
//     }
//   };

//   // Initialize Session Manager
//   useEffect(() => {
//     if (!accessToken) return; // Don't start session manager if not logged in

//     const manager = new SessionManager({
//       inactivityTimeout: 10 * 60 * 1000, // 10 minutes
//       warningTime: 2 * 60 * 1000, // 2 minutes warning
      
//       onActivity: handleTokenRefresh, // NEW: Refresh token on activity
      
//       onWarning: (remainingSeconds) => {
//         console.log('⚠️ Session warning:', remainingSeconds, 'seconds remaining');
//         setCountdown(remainingSeconds);
//         setShowWarning(true);
//       },
      
//       onLogout: (reason) => {
//         console.log('🔒 Session ended:', reason);
//         setShowWarning(false);
//         dispatch(logout());
        
//         const messages = {
//           'inactivity': 'Your session expired due to inactivity',
//           'tab_close': 'Session ended',
//           'other_tab': 'You have been logged out from another tab',
//           'manual': 'You have been logged out'
//         };
        
//         navigate('/login', { 
//           state: { 
//             message: messages[reason] || 'You have been logged out'
//           },
//           replace: true
//         });
//       },
      
//       onAutoSave: () => {
//         console.log('💾 Auto-saving form data...');
//       }
//     });

//     setSessionManager(manager);

//     return () => {
//       manager.destroy();
//     };
//   }, [dispatch, navigate, accessToken]);

//   const handleStayLoggedIn = () => {
//     console.log('✅ User chose to stay logged in');
//     sessionManager?.extendSession();
//     setShowWarning(false);
//   };

//   const handleLogout = () => {
//     console.log('👋 User chose to logout');
//     sessionManager?.logout('manual');
//   };

//   return (
//     <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
//       {isMobile && sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       <Sidebar
//         isOpen={sidebarOpen}
//         toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
//         isMobile={isMobile}
//       />

//       <div
//         className={`min-h-screen transition-all duration-300 ${
//           isMobile
//             ? "ml-0"
//             : sidebarOpen
//               ? "ml-64"
//               : "ml-20"
//         }`}
//       >
//         <Header
//           toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
//           sidebarOpen={sidebarOpen}
//           isMobile={isMobile}
//         />

//         <main className="p-4 md:p-8">
//           <Outlet context={{ sessionManager }} />
//         </main>
//       </div>

//       <SessionWarningModal
//         isOpen={showWarning}
//         countdown={countdown}
//         onStayLoggedIn={handleStayLoggedIn}
//         onLogout={handleLogout}
//       />
//     </div>
//   );
// }



// src/App.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, Header } from "./components";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./store/authSlice";
import SessionManager from "./utils/sessionManager";
import SessionWarningModal from "./components/SessionWarningModal";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sessionManager, setSessionManager] = useState(null);
  const sessionManagerRef = useRef(null);
  const isMounted = useRef(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { authStatus, accessToken } = useSelector((state) => state.auth);
  
  // Only initialize mobile check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Token refresh helper
  const handleTokenRefresh = async () => {
    try {
      console.log('🔄 Refreshing token on activity...');
      // Implement your refresh token logic here
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
    }
  };

  // Initialize SessionManager ONLY when fully authenticated
  useEffect(() => {
    if (!authStatus || !accessToken || isMounted.current) return;
    
    console.log('🚀 Initializing SessionManager - Authenticated:', authStatus);
    
    const manager = new SessionManager({
      inactivityTimeout: 10 * 60 * 1000, // 10 minutes
      warningTime: 1 * 60 * 1000,        // 2 minutes warning
      
      onActivity: handleTokenRefresh,
      
      onWarning: (remainingSeconds) => {
        console.log('⚠️ Session warning:', remainingSeconds);
        setCountdown(remainingSeconds);
        setShowWarning(true);
      },
      
      onLogout: (reason) => {
        console.log('🔒 SessionManager logout:', reason);
        setShowWarning(false);
        
        // Dispatch Redux logout (clears localStorage)
        dispatch(logout());
        
        const messages = {
          'inactivity': 'Your session expired due to inactivity. Please log in again.',
          'tab_close': 'Session ended',
          'other_tab': 'Logged out from another tab',
          'manual': 'You have been logged out'
        };
        
        navigate('/login', { 
          state: { message: messages[reason] || 'Session expired' },
          replace: true 
        });
      },
      
      onAutoSave: () => {
        console.log('💾 Auto-saving form data...');
      }
    });

    sessionManagerRef.current = manager;
    setSessionManager(manager);
    isMounted.current = true;

    return () => {
      console.log('🧹 Cleaning up SessionManager');
      manager.destroy();
      isMounted.current = false;
    };
  }, [authStatus, accessToken, dispatch, navigate]);

  const handleStayLoggedIn = () => {
    console.log('✅ Stay logged in clicked');
    sessionManagerRef.current?.extendSession();
    setShowWarning(false);
  };

  const handleLogout = () => {
    console.log('👋 Manual logout clicked');
    sessionManagerRef.current?.logout('manual');
  };

  // Re-initialize SessionManager if user logs in after logout
  useEffect(() => {
    if (authStatus && accessToken && !isMounted.current) {
      console.log('🔄 Re-authenticated, re-initializing SessionManager');
    }
  }, [authStatus, accessToken]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          isMobile
            ? "ml-0"
            : sidebarOpen
              ? "ml-64"
              : "ml-20"
        }`}
      >
        <Header
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />

        <main className="p-4 md:p-8">
          <Outlet context={{ sessionManager: sessionManagerRef.current }} />
        </main>
      </div>

      <SessionWarningModal
        isOpen={showWarning}
        countdown={countdown}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />
    </div>
  );
}
