
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store/store";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import usePersistLogin from "./hooks/usePersistLogin";
import { useSelector } from "react-redux";

// Pages & Components
import Login from "./components/Login";
import AuthLayout from "./components/AuthLayout";
import App from "./App";
import { 
  InvoiceViewPage, Unauthorized,
  EmployeePage, InvoiceFormPage,
  InvoicePage, DashboardPage, 
  CVKInvoiceView, HotelConfigPage,
  TRYPInvoiceView,
  DynamicInvoiceFormPage, 
  DynamicInvoiceViewPage,
  NotFoundPage
} from "./pages";

// Persist Wrapper
function PersistWrapper({ children }) {
  const isLoading = usePersistLogin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-[#003d7a] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <div className="w-12 h-12 mx-auto border-4 border-slate-200 border-t-[#003d7a] rounded-full animate-spin"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading Portal...</p>
          <p className="mt-2 text-slate-400 text-sm">Please wait</p>
        </div>
      </div>
    );
  }

  return children;
}

// Home redirect based on role
function HomeRedirect() {
  const user = useSelector((state) => state.auth.userData);
  const role = user?.role || user?.user?.role;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (role === "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (role === "moderator") {
    return <Navigate to="/hotel-configuration" replace />;
  }
  
  // Employee default
  return <Navigate to="/invoices" replace />;
}

const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    path: "/login",
    element: (
      <AuthLayout authentication={false}>
        <Login />
      </AuthLayout>
    ),
  },
  
  // PROTECTED ROUTES
  {
    path: "/",
    element: (
      <AuthLayout authentication={true}>
        <App />
      </AuthLayout>
    ),
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      
      // ADMIN ONLY - Dashboard
      {
        path: "dashboard",
        element: (
          <AuthLayout authentication={true} allowedRoles={["super_admin"]}>
            <DashboardPage />
          </AuthLayout>
        ),
      },
      
      // ALL AUTHENTICATED USERS - Invoices
      {
        path: "invoices",
        element: <InvoicePage />,
      },
      
      // ALL AUTHENTICATED USERS - Employees
      {
        path: "employees",
        element: <EmployeePage />,
      },
      
      // ADMIN ONLY - Create Invoice
      {
        path: "invoice/create",
        element: (
          <AuthLayout authentication={true} allowedRoles={["super_admin"]}>
            <InvoiceFormPage />
          </AuthLayout>
        ),
      },
      
      // ADMIN & EMPLOYEE - Edit Invoice
      {
        path: "invoice/edit/:id",
        element: (
          <AuthLayout authentication={true} allowedRoles={["employee", "super_admin"]}>
            <InvoiceFormPage />
          </AuthLayout>
        ),
      },
      
      // ADMIN ONLY - Create Dynamic Invoice
      {
        path: "invoice/create/:hotelId",
        element: (
          <AuthLayout authentication={true} allowedRoles={["super_admin"]}>
            <DynamicInvoiceFormPage />
          </AuthLayout>
        ),
      },
      
      // ADMIN & EMPLOYEE - Edit Dynamic Invoice
      {
        path: "invoices/edit/:invoiceId",
        element: (
          <AuthLayout authentication={true} allowedRoles={["employee", "super_admin"]}>
            <DynamicInvoiceFormPage />
          </AuthLayout>
        ),
      },
      
      // MODERATOR & ADMIN - Hotel Configuration
      {
        path: "hotel-configuration",
        element: (
          <AuthLayout authentication={true} allowedRoles={["moderator"]}>
            <HotelConfigPage />
          </AuthLayout>
        ),
      },
    ],
  },
  
  // PUBLIC INVOICE VIEWS (no auth required)
  {
    path: "invoice/cvkview/:invoiceNumber",
    element: <CVKInvoiceView />,
  },
  {
    path: "invoice/view/:invoiceId",
    element: <DynamicInvoiceViewPage />,
  },
  {
    path: "invoice/trypview/:invoiceNumber",
    element: <TRYPInvoiceView />,
  },
  
  // ERROR ROUTES
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistWrapper>
        <RouterProvider router={router} />
      </PersistWrapper>
    </Provider>
  </StrictMode>
);
