// src/components/Sidebar.jsx
"use client";

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Settings, FileText, Truck, Briefcase,
  ChevronLeft, ChevronRight, LogOut, X, Hotel
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import logo from "../../assets/logo.png";
import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "../../store/authSlice";
import { authService } from "../../Api/auth.api";

export default function Sidebar({ isOpen, toggleSidebar, isMobile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth || {});
  const isAuthenticated = authState.authStatus || false;
  
  const userData = authState.userData?.user || authState.userData || null;
  const userRole = userData?.role;

  const activePath = location.pathname;

  // Define menu items based on role
  const getMenuItems = () => {
    const baseMenu = [
      { icon: FileText, label: "Invoices", path: "/invoices" },
    ];

    if (userRole === "super_admin") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        ...baseMenu,
        { icon: Briefcase, label: "Employees", path: "/employees" },
        { icon: Hotel, label: "Hotel Config", path: "/hotel-configuration" },
        { icon: Settings, label: "Settings", path: "/settings" },
      ];
    }

    if (userRole === "moderator") {
      return [
        ...baseMenu,
        { icon: Hotel, label: "Hotel Config", path: "/hotel-configuration" },
      ];
    }

    // Employee - only invoices
    return baseMenu;
  };

  const menuItems = getMenuItems();

  const isItemActive = (itemPath) => {
    if (itemPath === "/dashboard") return activePath === "/" || activePath === "/dashboard";
    if (itemPath === "/") return activePath === "/";
    return activePath === itemPath || activePath.startsWith(`${itemPath}/`);
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) toggleSidebar();
  };

  const handleLogout = () => {
    console.log("🚪 Logout initiated");
    
    try {
      authService.logout();
      dispatch(logoutAction());
      navigate("/login", { replace: true });
      
      if (isMobile) toggleSidebar();
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const displayName = userData?.fullname || 
                      userData?.full_name || 
                      userData?.username || 
                      userData?.email?.split("@")[0] || 
                      `User ${userData?.id || ''}`;
  const displayRole = userRole === "super_admin" ? "Super Admin" : 
                     userRole === "moderator" ? "Moderator" : "Employee";
  const initials = displayName ? displayName[0].toUpperCase() : "U";
  
  const pictureField = userData?.picture || userData?.avatar || userData?.image_url;
  const pictureUrl = pictureField 
    ? (pictureField.startsWith('http') 
        ? pictureField 
        : `${import.meta.env.VITE_BACKEND_URL}/uploads/${pictureField}`)
    : null;

  return (
    <aside
      className={`
        bg-[#003d7a] text-white h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 border-r border-[#002a5c] shadow-2xl font-sans
        ${isOpen ? "w-64" : "w-20"}
        ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
      `}
    >
      {isMobile && isOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white md:hidden z-50"
        >
          <X size={20} />
        </button>
      )}

      <div className="h-20 flex items-center justify-center relative mb-2 px-4">
        <div
          className={`bg-white rounded-lg flex items-center justify-center shadow-md transition-all overflow-hidden ${
            isOpen ? "w-full h-12 px-2" : "w-10 h-10 p-1"
          }`}
        >
          <img src={logo} alt="Azar Travel" className="w-full h-full object-contain" />
        </div>

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white text-[#003d7a] border border-blue-100 rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:text-[#f39c12] transition-all z-50"
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            isCollapsed={!isOpen}
            hasSubmenu={item.hasSubmenu}
            isActive={isItemActive(item.path)}
            onClick={() => handleNavClick(item.path)}
          />
        ))}
      </nav>

      {isAuthenticated && (
        <div className="p-4 border-t border-[#002a5c] mt-auto bg-[#003266]">
          <div className={`flex items-center ${isOpen ? 'gap-3' : 'flex-col gap-2'}`}>
            <div className="flex-shrink-0">
              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#f39c12] shadow-sm"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#f39c12] flex items-center justify-center text-[#003d7a] font-bold text-lg border-2 border-[#003d7a]">
                  {initials}
                </div>
              )}
            </div>

            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white">{displayName}</p>
                <p className="text-xs text-blue-200 truncate">{displayRole}</p>
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`text-blue-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ${
                isOpen ? 'p-2 rounded-lg' : 'p-1.5 rounded-full bg-white/5'
              }`}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
