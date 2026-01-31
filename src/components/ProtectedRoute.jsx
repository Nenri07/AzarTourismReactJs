// src/components/ProtectedRoute.jsx
// Optional: Additional layer of protection against flashing

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { authStatus, userData } = useSelector((state) => state.auth);
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Immediate validation - synchronous
    const validate = () => {
      // Check localStorage first (fastest)
      const token = localStorage.getItem('accessToken');
      const storedUserData = localStorage.getItem('userData');

      // No token = not authorized
      if (!token || !storedUserData) {
        setIsAuthorized(false);
        setIsValidating(false);
        return;
      }

      // Check Redux state
      if (!authStatus) {
        setIsAuthorized(false);
        setIsValidating(false);
        return;
      }

      // Check role if required
      if (allowedRoles.length > 0) {
        const role = userData?.role || userData?.user?.role;
        if (!role || !allowedRoles.includes(role)) {
          setIsAuthorized(false);
          setIsValidating(false);
          return;
        }
      }

      // All checks passed
      setIsAuthorized(true);
      setIsValidating(false);
    };

    validate();
  }, [authStatus, userData, allowedRoles]);

  // Show nothing while validating (prevents flash)
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not authorized - redirect to login
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  // Authorized - render children
  return <>{children}</>;
}