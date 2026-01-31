

// import { useEffect, useState } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate, useLocation } from "react-router-dom";

// export default function AuthLayout({ 
//   children, 
//   authentication = true, 
//   allowedRoles = [] 
// }) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [loading, setLoading] = useState(true);
  
//   const authStatus = useSelector((state) => state.auth.authStatus);
//   const userData = useSelector((state) => state.auth.userData);
//   const userRole = userData?.role || userData?.user?.role;

//   useEffect(() => {
//     console.log("🔐 AuthLayout Check:", {
//       path: location.pathname,
//       authentication,
//       authStatus,
//       userRole,
//       allowedRoles
//     });

//     // If route requires authentication but user is not logged in
//     if (authentication && !authStatus) {
//       console.log("❌ Not authenticated - redirecting to login");
//       navigate("/login", { 
//         replace: true,
//         state: { from: location.pathname }
//       });
//       return;
//     }

//     // If route is login page but user is already logged in
//     if (!authentication && authStatus) {
//       console.log("✅ Already authenticated - redirecting to home");
//       navigate("/", { replace: true });
//       return;
//     }

//     // If route has role restrictions
//     if (authentication && authStatus && allowedRoles.length > 0) {
//       if (!allowedRoles.includes(userRole)) {
//         console.warn(`❌ Access denied: User role '${userRole}' not in allowed roles:`, allowedRoles);
//         navigate("/unauthorized", { replace: true });
//         return;
//       }
//       console.log("✅ Role check passed:", userRole);
//     }

//     setLoading(false);
//   }, [authStatus, authentication, navigate, allowedRoles, userRole, location]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-slate-200 border-t-[#003d7a] rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-slate-600 font-medium">Verifying access...</p>
//         </div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }



import { useEffect, useState, useRef } from "react";
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
  const hasNavigated = useRef(false);
  
  const authStatus = useSelector((state) => state.auth.authStatus);
  const userData = useSelector((state) => state.auth.userData);
  const userRole = userData?.role || userData?.user?.role;

  useEffect(() => {
    // Reset navigation flag when location changes
    hasNavigated.current = false;
  }, [location.pathname]);

  useEffect(() => {
    // Prevent multiple navigations
    if (hasNavigated.current) {
      return;
    }

    console.log("🔐 AuthLayout Check:", {
      path: location.pathname,
      authentication,
      authStatus,
      userRole,
      allowedRoles
    });

    // If route requires authentication but user is not logged in
    if (authentication && !authStatus) {
      console.log("❌ Not authenticated - redirecting to login");
      hasNavigated.current = true;
      navigate("/login", { 
        replace: true,
        state: { from: location.pathname }
      });
      return;
    }

    // If route is login page but user is already logged in
    if (!authentication && authStatus) {
      console.log("✅ Already authenticated - redirecting to home");
      hasNavigated.current = true;
      navigate("/", { replace: true });
      return;
    }

    // If route has role restrictions
    if (authentication && authStatus && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole)) {
        console.warn(`❌ Access denied: User role '${userRole}' not in allowed roles:`, allowedRoles);
        hasNavigated.current = true;
        navigate("/unauthorized", { replace: true });
        return;
      }
      console.log("✅ Role check passed:", userRole);
    }

    setLoading(false);
  }, [authStatus, authentication, navigate, allowedRoles, userRole, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#003d7a] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}