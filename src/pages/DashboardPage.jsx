"use client";

import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Eye,
} from "lucide-react";

// 1. Reusable Stats Card Component
const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  colorClass,
  bgClass,
}) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <div className={`p-2.5 md:p-3 rounded-lg ${bgClass} ${colorClass}`}>
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
        >
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">
        {title}
      </p>
      <h3 className="text-xl md:text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

// 2. Mobile Invoice Card Component
const InvoiceCard = ({ invoice, getStatusColor }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="font-bold text-[#003d7a] text-sm mb-1">{invoice.id}</p>
        <p className="text-slate-700 font-medium text-sm">{invoice.client}</p>
      </div>
      <button className="text-slate-400 hover:text-[#003d7a] p-1">
        <MoreVertical size={18} />
      </button>
    </div>

    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
      <div>
        <p className="text-xs text-slate-500 mb-1">Amount</p>
        <p className="font-bold text-slate-900">{invoice.amount}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500 mb-1">{invoice.date}</p>
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}
        >
          {invoice.status}
        </span>
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  // Dummy Data
  const stats = [
    {
      title: "Total Invoices",
      value: "1,284",
      icon: FileText,
      trend: "12.5%",
      trendUp: true,
      colorClass: "text-[#003d7a]",
      bgClass: "bg-blue-50",
    },
    {
      title: "Pending Approval",
      value: "42",
      icon: Clock,
      trend: "2.1%",
      trendUp: false,
      colorClass: "text-[#f39c12]",
      bgClass: "bg-amber-50",
    },
    {
      title: "Completed",
      value: "1,156",
      icon: CheckCircle,
      trend: "8.4%",
      trendUp: true,
      colorClass: "text-green-600",
      bgClass: "bg-green-50",
    },
    {
      title: "Rejected / Issues",
      value: "86",
      icon: AlertCircle,
      trend: "1.2%",
      trendUp: false,
      colorClass: "text-red-500",
      bgClass: "bg-red-50",
    },
  ];

  const recentInvoices = [
    {
      id: "INV-2024-001",
      client: "Grand Plaza Hotel",
      amount: "$1,200.00",
      status: "Completed",
      date: "Oct 24, 2024",
    },
    {
      id: "INV-2024-002",
      client: "Seaside Resort",
      amount: "$850.50",
      status: "Pending",
      date: "Oct 24, 2024",
    },
    {
      id: "INV-2024-003",
      client: "Urban Stay Suites",
      amount: "$2,340.00",
      status: "Processing",
      date: "Oct 23, 2024",
    },
    {
      id: "INV-2024-004",
      client: "Metro Business",
      amount: "$560.00",
      status: "Completed",
      date: "Oct 22, 2024",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Processing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="px-1">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1">
          Welcome back, John. Here is what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Invoices Table/Cards */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-base md:text-lg">
              Recent Invoices
            </h3>
            <button className="text-[#003d7a] text-sm font-semibold hover:underline">
              View All
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs uppercase text-slate-400 font-semibold tracking-wider border-b border-slate-100">
                  <th className="px-4 lg:px-6 py-4">Invoice ID</th>
                  <th className="px-4 lg:px-6 py-4">Client / Hotel</th>
                  <th className="px-4 lg:px-6 py-4">Date</th>
                  <th className="px-4 lg:px-6 py-4">Amount</th>
                  <th className="px-4 lg:px-6 py-4">Status</th>
                  <th className="px-4 lg:px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors text-sm group"
                  >
                    <td className="px-4 lg:px-6 py-4 font-semibold text-[#003d7a]">
                      {inv.id}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-700 font-medium">
                      {inv.client}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-500">
                      {inv.date}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-900 font-bold">
                      {inv.amount}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-[#003d7a]">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            {recentInvoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </div>

        {/* Side Panel: Quick Actions */}
        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
          {/* Quick Actions Card */}
          <div className="bg-[#003d7a] rounded-xl p-5 md:p-6 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden">
            {/* Abstract circle decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

            <h3 className="font-bold text-base md:text-lg mb-4 relative z-10">
              Quick Actions
            </h3>
            <div className="space-y-3 relative z-10">
              <button className="w-full bg-white text-[#003d7a] py-2.5 md:py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                <FileText size={16} />
                Add New Employee
              </button>
              <button className="w-full bg-[#004e9a] text-white border border-white/10 py-2.5 md:py-3 rounded-lg font-medium text-sm hover:bg-[#005ba3] transition-colors flex items-center justify-center gap-2">
                Export Monthly Report
              </button>
            </div>
          </div>

          {/* System Status / Mini Info */}
          <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 text-xs md:text-sm uppercase tracking-wide">
              System Health
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-slate-600">API Status</span>
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="text-slate-600">Last Sync</span>
                <span className="text-slate-900 font-medium">2 mins ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
