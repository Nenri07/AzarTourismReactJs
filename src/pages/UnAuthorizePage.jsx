// src/pages/Unauthorized.jsx
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ShieldAlert, ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);
  const userRole = userData?.role || userData?.user?.role;

  // Determine home page based on role
  const getHomePage = () => {
    if (userRole === "super_admin") return "/dashboard";
    if (userRole === "moderator") return "/hotel-configuration";
    if (userRole === "employee") return "/invoices";
    return "/";
  };

  const homePage = getHomePage();

  const handleGoBack = () => {
    // Always go to home page on unauthorized (safer than going back)
    navigate(homePage, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <ShieldAlert size={48} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-2">403</h1>
            <h2 className="text-2xl font-semibold text-white/90">Access Restricted</h2>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <div className="text-center mb-8">
              <p className="text-gray-700 text-lg mb-4">
                You don't have permission to access this page.
              </p>
              <p className="text-gray-500">
                This area is restricted. If you need access to this feature, 
                please contact your system administrator.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <HelpCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                  <p className="text-blue-800 text-sm">
                    Contact your administrator or IT support team for assistance with access permissions.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGoBack}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Go Back
              </button>

              <button
                onClick={() => navigate(homePage, { replace: true })}
                className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Go to Home
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Azar Tourism Internal Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}