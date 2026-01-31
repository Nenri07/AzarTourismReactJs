// // // src/hooks/usePersistLogin.js
// // import { useEffect, useState } from 'react';
// // import { useDispatch } from 'react-redux';
// // import { authService } from '../Api/auth.api';
// // import { login, logout } from '../store/authSlice';

// // const usePersistLogin = () => {
// //   const [isLoading, setIsLoading] = useState(true);
// //   const dispatch = useDispatch();

// //   useEffect(() => {
// //     const persist = async () => {
// //       const token = localStorage.getItem('accessToken');
// //       if (!token) {
// //         setIsLoading(false);
// //         return;
// //       }

// //       try {
// //         const user = await authService.getCurrentUser();
// //         dispatch(login({
// //           userData: user,
// //           accessToken: token
// //         }));
// //       } catch (err) {
// //         localStorage.removeItem('accessToken');
// //         dispatch(logout());
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     persist();
// //   }, [dispatch]);

// //   return isLoading;
// // };

// // export default usePersistLogin;


// // src/hooks/usePersistLogin.js
// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { refreshData } from '../store/authSlice';

// export default function usePersistLogin() {
//   const [isLoading, setIsLoading] = useState(true);
//   const dispatch = useDispatch();
//   const { authStatus } = useSelector(state => state.auth);

//   useEffect(() => {
//     const restoreSession = () => {
//       try {
//         // Check if user data exists in localStorage
//         const accessToken = localStorage.getItem('accessToken');
//         const userDataStr = localStorage.getItem('userData');

//         if (accessToken && userDataStr) {
//           const userData = JSON.parse(userDataStr);
          
//           // Restore to Redux
//           dispatch(refreshData({
//             userData,
//             accessToken,
//           }));
//         }
//       } catch (error) {
//         console.error('Failed to restore session:', error);
//         // Clear corrupted data
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         localStorage.removeItem('userData');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     // Only restore if not already authenticated
//     if (!authStatus) {
//       restoreSession();
//     } else {
//       setIsLoading(false);
//     }
//   }, [authStatus, dispatch]);

//   return isLoading;
// }




// src/hooks/usePersistLogin.js
import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../store/authSlice'; // Use LOGIN action, not refreshData

export default function usePersistLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const restoreSession = useCallback(async () => {
    try {
      console.log('🔄 Restoring session from localStorage...');
      
      // Check if we have stored data
      const accessToken = localStorage.getItem('accessToken');
      const userDataStr = localStorage.getItem('userData');

      console.log('📦 localStorage check:', {
        hasToken: !!accessToken,
        hasUserData: !!userDataStr,
        tokenPreview: accessToken ? `${accessToken.slice(0, 20)}...` : null
      });

      // If missing either, clear everything and stop
      if (!accessToken || !userDataStr) {
        console.log('❌ No valid session data found');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        setIsLoading(false);
        return;
      }

      // Parse user data safely
      let userData;
      try {
        userData = JSON.parse(userDataStr);
        console.log('✅ Parsed userData:', userData);
      } catch (parseError) {
        console.error('❌ Failed to parse userData:', parseError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        setIsLoading(false);
        return;
      }

      // Validate userData structure matches your API response
      const hasValidUser = userData?.user?.id && userData?.user?.role;
      if (!hasValidUser) {
        console.error('❌ Invalid userData structure:', userData);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        setIsLoading(false);
        return;
      }

      // Normalize role (super-admin → super_admin)
      if (userData.user.role.includes('-')) {
        userData.user.role = userData.user.role.replace(/-/g, '_');
        console.log('🔧 Normalized role:', userData.user.role);
      }

      console.log('✅ Session restored successfully for:', userData.user.email);

      // Dispatch LOGIN action (NOT refreshData)
      dispatch(login({
        userData,
        accessToken
      }));

    } catch (error) {
      console.error('❌ Critical error in restoreSession:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return isLoading;
}
