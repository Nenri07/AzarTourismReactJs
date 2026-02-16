import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
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
    // Check if there's a valid history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // If no history, go to home page
      navigate(homePage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#003d7a]">404</h1>
          <p className="text-2xl font-semibold text-slate-700 mt-4">
            Page Not Found
          </p>
          <p className="text-slate-500 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          
          <button
            onClick={() => navigate(homePage)}
            className="flex items-center gap-2 px-6 py-3 bg-[#003d7a] hover:bg-[#002e5c] text-white rounded-lg transition-colors"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}