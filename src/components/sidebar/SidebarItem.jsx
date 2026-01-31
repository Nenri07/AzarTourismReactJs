"use client"

export default function SidebarItem({ icon: Icon, label, isCollapsed, hasSubmenu, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 md:py-3 rounded-lg transition-all duration-200 font-medium text-sm
        ${isActive 
          ? "bg-[#f39c12] text-white shadow-md shadow-[#f39c12]/30" 
          : "text-blue-100 hover:bg-white/10 hover:text-white"
        }
        ${isCollapsed ? "justify-center" : ""}
      `}
    >
      <Icon size={20} className="min-w-[20px]" />
      {!isCollapsed && (
        <span className="flex-1 text-left truncate">{label}</span>
      )}
      {!isCollapsed && hasSubmenu && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  )
}
