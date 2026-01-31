"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { Bell, Search, Menu } from "lucide-react"

const routeTitleMap = {
  "/": "Dashboard",
  "/invoices": "Invoices",
  "/invoice/create": "Create Invoice",
  "/invoice/edit/": "Edit Invoice",
  "/invoice/view/": "View Invoice",
  "/employees": "Employees",
  "/users": "Users Management",
  "/config": "Configuration",
  "/custom-invoices": "Custom Invoices",
}

export default function Header({ toggleSidebar, isMobile }) {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  // Build breadcrumb segments
  const crumbs = ["Azar Tourism"]

  if (path === "/") {
    crumbs.push("Dashboard")
  } else if (path === "/invoices") {
    crumbs.push("Invoices")
  } else if (path === "/invoice/create") {
    crumbs.push("Invoices", "Create Invoice")
  } else if (path.startsWith("/invoice/edit/")) {
    crumbs.push("Invoices", "Edit Invoice")
  } else if (path.startsWith("/invoice/view/")) {
    crumbs.push("Invoices", "View Invoice")
  } else if (path === "/employees") {
    crumbs.push("Employees")
  } else if (path === "/users") {
    crumbs.push("Users Management")
  } else if (path === "/config") {
    crumbs.push("Configuration")
  } else if (path === "/custom-invoices") {
    crumbs.push("Custom Invoices")
  }

  const getInvoiceIdFromPath = () => {
    if (path.startsWith("/invoice/edit/") || path.startsWith("/invoice/view/")) {
      const parts = path.split("/")
      return parts[parts.length - 1]
    }
    return null
  }

  const invoiceId = getInvoiceIdFromPath()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
      
    
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle Menu"
          >
            <Menu size={22} className="text-slate-700" />
          </button>
        )}

        {/* Breadcrumb - responsive */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-hidden">
          {/* Root: Azar Tourism */}
          <span
            className="text-slate-400 font-medium cursor-pointer hover:text-[#003d7a] transition-colors truncate flex-shrink-0"
            onClick={() => navigate("/")}
          >
            {crumbs[0]}
          </span>

          {crumbs.slice(1).map((label, index) => {
            const isLast = index === crumbs.length - 2
            const isClickable = label === "Invoices" && path !== "/invoices"

            return (
              <span key={index} className="flex items-center gap-1 sm:gap-2 min-w-0">
                <span className="text-slate-300 flex-shrink-0">/</span>
                <span
                  className={`truncate ${
                    isLast
                      ? "text-[#003d7a] font-bold text-sm sm:text-base md:text-lg"
                      : isClickable
                      ? "text-slate-500 font-medium cursor-pointer hover:text-[#003d7a] transition-colors"
                      : "text-slate-500 font-medium"
                  }`}
                  onClick={() => {
                    if (isClickable) navigate("/invoices")
                  }}
                >
                  {label}
                  {/* Invoice ID badge */}
                  {((label === "Edit Invoice" || label === "View Invoice") && invoiceId) && (
                    <span className="ml-1 sm:ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap">
                      #{invoiceId}
                    </span>
                  )}
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Right: Search + Notifications */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Search Bar - Hidden on small screens */}
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-2 w-48 lg:w-64 focus-within:ring-2 focus-within:ring-[#003d7a]/10 transition-all">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm ml-2 w-full placeholder:text-slate-400 text-slate-600"
          />
        </div>

        {/* Search Icon for Mobile */}
        <button className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Search size={20} className="text-slate-600" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-[#003d7a] transition-colors rounded-lg hover:bg-slate-50">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  )
}