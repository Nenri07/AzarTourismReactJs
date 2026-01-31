// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useLocation, useNavigate } from "react-router-dom";

// function AuthLayout({
//   children,
//   authentication = true,
//   allowedRoles = [],
// }) {
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const location = useLocation();

//   const { authStatus, userData } = useSelector((state) => state.auth);
//   const currentRole = userData?.role;

//   useEffect(() => {
//     // Require login but user not authenticated → redirect to login
//     if (authentication && !authStatus) {
//       navigate("/login", { replace: true, state: { from: location } });
//       setLoading(false);
//       return;
//     }

//     // Authenticated user on public route (login/register) → redirect to dashboard
//     if (!authentication && authStatus) {
//       navigate("/dashboard", { replace: true });
//       setLoading(false);
//       return;
//     }

//     // Authenticated user trying to access login page → redirect to dashboard
//     if (authStatus && location.pathname === "/login") {
//       navigate("/", { replace: true });
//       setLoading(false);
//       return;
//     }

//     // RBAC: Check if user has required role
//     if (authentication && allowedRoles.length > 0) {
//       if (!currentRole || !allowedRoles.includes(currentRole)) {
//         navigate("/unauthorized", { replace: true });
//         setLoading(false);
//         return;
//       }
//     }

//     // All checks passed → render the page
//     setLoading(false);
//   }, [authStatus, currentRole, authentication, allowedRoles, navigate, location.pathname]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <span className="loading loading-bars loading-lg"></span>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

// export default AuthLayout;



// src/components/AuthLayout.jsx
// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useLocation, useNavigate, Navigate } from "react-router-dom";

// function AuthLayout({ children, authentication = true, allowedRoles = [] }) {
//   const location = useLocation();
//   const { authStatus, userData } = useSelector((state) => state.auth);
//   const currentRole = userData?.user?.role;

//   // Require login but user not authenticated → redirect to login
//   if (authentication && !authStatus) {
//     return <Navigate to="/login" replace state={{ from: location }} />;
//   }

//   // Authenticated user on public route (login/register) → redirect to dashboard
//   if (!authentication && authStatus) {
//     return <Navigate to="/" replace />;
//   }

//   // Authenticated user trying to access login page → redirect to dashboard
//   if (authStatus && location.pathname === "/login") {
//     return <Navigate to="/" replace />;
//   }

//   // RBAC: Check if user has required role
//   if (authentication && allowedRoles.length > 0) {
//     if (!currentRole || !allowedRoles.includes(currentRole)) {
//       return <Navigate to="/unauthorized" replace />;
//     }
//   }

//   // All checks passed → render the page
//   return <>{children}</>;
// }

// export default AuthLayout;



// src/components/AuthLayout.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthLayout({ 
  children, 
  authentication = true, 
  allowedRoles = [] 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  
  const authStatus = useSelector((state) => state.auth.authStatus);
  const userData = useSelector((state) => state.auth.userData);
  const userRole = userData?.role || userData?.user?.role;

  useEffect(() => {
    // If route requires authentication but user is not logged in
    if (authentication && !authStatus) {
      navigate("/login", { 
        replace: true,
        state: { from: location.pathname }
      });
      return;
    }

    // If route is login page but user is already logged in
    if (!authentication && authStatus) {
      navigate("/", { replace: true });
      return;
    }

    // If route has role restrictions
    if (authentication && authStatus && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole)) {
        console.warn(`Access denied: User role '${userRole}' not in allowed roles:`, allowedRoles);
        navigate("/unauthorized", { replace: true });
        return;
      }
    }

    setLoading(false);
  }, [authStatus, authentication, navigate, allowedRoles, userRole, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#003d7a] rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
