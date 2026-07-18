import React from "react";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Wallet, 
  Percent, 
  MapPin, 
  Clock, 
  Award,
  ArrowRight,
  Sparkles,
  TrendingDown,
  LineChart as LineIcon,
  Search,
  Globe
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { Lead, Customer, Service, Booking } from "../types";

interface DashboardProps {
  leads: Lead[];
  customers: Customer[];
  services: Service[];
  bookings: Booking[];
  employees?: any[];
  partners?: any[];
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ 
  leads, 
  customers, 
  services, 
  bookings,
  employees,
  setActiveTab 
}: DashboardProps) {

  // Helper to format currency in Ghanaian Cedis (GHS)
  const formatGHS = (val: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Helper to resolve the reference date for demo purposes
  const getTodayString = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const sysToday = getTodayString();
  
  // Use real system date today for dynamic metrics
  const activeTodayDate = sysToday;
  const activeMonthYear = sysToday.substring(3); // e.g. "07/2026"

  // Filter lists based on active date
  const activeLeads = leads.filter(l => !l.isDeleted);
  const activeBookings = bookings.filter(b => !b.isDeleted);

  // 1. New enquiries today
  const enquiriesToday = activeLeads.filter(l => l.dateReceived === activeTodayDate).length;

  // 2. New enquiries this month
  const enquiriesThisMonth = activeLeads.filter(l => (l.dateReceived || "").endsWith(activeMonthYear)).length;

  // 3. Bookings confirmed today
  const bookingsConfirmedToday = activeBookings.filter(b => 
    b.appointmentDate === activeTodayDate && b.stage === "Booking Confirmed"
  ).length;

  // 4. Sessions completed today
  const sessionsCompletedToday = activeBookings.filter(b => 
    b.appointmentDate === activeTodayDate && (b.stage === "Service Completed" || b.stage === "Closed Won" || b.stage === "Paid")
  ).length;

  // 5. Revenue collected today in GHS
  const revenueCollectedToday = activeBookings
    .filter(b => b.appointmentDate === activeTodayDate)
    .reduce((sum, b) => sum + b.amountPaid, 0);

  // 6. Revenue collected this month in GHS
  const revenueCollectedThisMonth = activeBookings
    .filter(b => (b.appointmentDate || "").endsWith(activeMonthYear))
    .reduce((sum, b) => sum + b.amountPaid, 0);

  // 7. Outstanding payments
  const outstandingPayments = activeBookings.reduce((sum, b) => sum + b.balance, 0);

  // 8. Enquiry-to-booking conversion rate
  // Calculation: Leads that successfully booked (Booking Confirmed or Customer Created) / Total Leads * 100
  const totalLeadsCount = activeLeads.length;
  const convertedLeadsCount = activeLeads.filter(l => 
    l.status === "Booking Confirmed" || l.status === "Customer Created"
  ).length;
  const conversionRate = totalLeadsCount > 0 
    ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) 
    : 0;

  // 9. Recharts Data: Leads by Source
  const sourceCounts = activeLeads.reduce((acc: { [key: string]: number }, lead) => {
    const src = lead.source || "Unknown";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const leadsBySourceData = Object.keys(sourceCounts).map(source => ({
    name: source,
    value: sourceCounts[source]
  }));

  const PIE_COLORS = [
    "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", 
    "#1d4ed8", "#2563eb", "#3b82f6", "#f59e0b", "#d97706"
  ];

  // 10. Recharts Data: Revenue by Customer Area
  const areaRevenue = activeBookings.reduce((acc: { [key: string]: number }, b) => {
    const areaName = b.area || "Unknown";
    acc[areaName] = (acc[areaName] || 0) + (b.finalAmount || 0);
    return acc;
  }, {});

  const revenueByAreaData = Object.keys(areaRevenue).map(area => ({
    name: area,
    revenue: areaRevenue[area]
  })).sort((a, b) => b.revenue - a.revenue);

  // 11. Upcoming bookings list (today & future bookings sorted chronologically)
  const parseDateStr = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("/")) return 0;
    const parts = dateStr.split("/");
    if (parts.length < 3) return 0;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
    return new Date(year, month - 1, day).getTime();
  };

  const upcomingBookings = activeBookings
    .filter(b => {
      if (b.stage === "Closed Lost") return false;
      return parseDateStr(b.appointmentDate) >= parseDateStr(activeTodayDate);
    })
    .sort((a, b) => parseDateStr(a.appointmentDate) - parseDateStr(b.appointmentDate))
    .slice(0, 5);

  // 12. Performance Overview Metrics (Current Month)
  const activeBookingsThisMonth = activeBookings.filter(b => (b.appointmentDate || "").endsWith(activeMonthYear));
  const totalActiveBookingsThisMonth = activeBookingsThisMonth.length;
  const netRevenueThisMonth = activeBookingsThisMonth.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
  
  const activeTherapists = (employees || []).filter(e => !e.isDeleted && e.status === "Active" && e.department === "Therapy");
  const uniqueTherapistsThisMonth = new Set(
    activeBookingsThisMonth.filter(b => b.employeeId).map(b => b.employeeId)
  ).size;
  
  const therapistUtilizationRate = activeTherapists.length > 0 
    ? Math.round((uniqueTherapistsThisMonth / activeTherapists.length) * 100) 
    : 0;

  // USER REQUEST #3: Line Chart dynamic data for Month-over-Month Revenue Growth Performance
  // We compute invoiced and collected totals across each active month.
  const getMonthYear = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("/")) return "07/2026";
    const parts = dateStr.split("/");
    if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
    return "07/2026";
  };

  const monthlyMap: { [key: string]: { invoiced: number, collected: number } } = {};

  bookings.forEach(b => {
    if (b.isDeleted) return;
    const my = getMonthYear(b.appointmentDate);
    if (!monthlyMap[my]) {
      monthlyMap[my] = { invoiced: 0, collected: 0 };
    }
    monthlyMap[my].invoiced += b.finalAmount;
    monthlyMap[my].collected += b.amountPaid;
  });

  const sortedMonths = Object.keys(monthlyMap).sort((a, b) => {
    const [mA, yA] = a.split("/").map(Number);
    const [mB, yB] = b.split("/").map(Number);
    return (yA * 12 + mA) - (yB * 12 + mB);
  });

  const formatMonthLabel = (mStr: string) => {
    if (!mStr || !mStr.includes("/")) return mStr;
    const [month, year] = mStr.split("/");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${months[mIdx]} ${year}`;
    }
    return mStr;
  };

  const momTrendData = sortedMonths.map(m => {
    return {
      month: formatMonthLabel(m),
      "Monthly Invoiced": monthlyMap[m].invoiced,
      "Monthly Collected": monthlyMap[m].collected
    };
  });

  // USER REQUEST #1 & #2: Marketing analytics specifically evaluating Google Ads & Google Organic Search
  const googleSearchAdsLeads = activeLeads.filter(l => l.source === "Google Search Ads");
  const googleOrganicLeads = activeLeads.filter(l => l.source === "Google Organic Search");

  const adsConvertedCount = googleSearchAdsLeads.filter(l => l.status === "Booking Confirmed" || l.status === "Customer Created").length;
  const organicConvertedCount = googleOrganicLeads.filter(l => l.status === "Booking Confirmed" || l.status === "Customer Created").length;

  const adsConvRate = googleSearchAdsLeads.length > 0 ? Math.round((adsConvertedCount / googleSearchAdsLeads.length) * 100) : 0;
  const organicConvRate = googleOrganicLeads.length > 0 ? Math.round((organicConvertedCount / googleOrganicLeads.length) * 100) : 0;

  return (
    <div id="crm-dashboard-container" className="space-y-8">
      
      {/* Premium Welcome Banner */}
      <div id="dashboard-hero-banner" className="bg-emerald-950 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-emerald-900">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6 pointer-events-none">
          <Award size={300} className="text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-800 text-emerald-200 text-[10px] md:text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              SpaWellGhana HQ
            </span>
            <span className="bg-emerald-900/60 text-emerald-300 text-[10px] md:text-xs px-2 py-1 rounded-full font-mono flex items-center gap-1">
              <Sparkles size={12} /> Live Sync Active
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold font-sans tracking-tight">
            SpaWellGhana CRM Dashboard
          </h1>
          <p className="text-emerald-100 font-light text-xs md:text-sm max-w-2xl leading-relaxed">
            Welcome back! Monitor live massage bookings, track marketing source pipelines, resolve outstanding GHS payments, and manage mobile wellness enquiries across Accra.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-emerald-200">
            <span>📅 Current Date: {activeTodayDate}</span>
            <span>📍 Area Scope: Accra Metropolitan</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* New Enquiries */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">New Enquiries</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-sans">{enquiriesToday}</span>
              <span className="text-slate-400 text-xs">today</span>
            </div>
            <span className="text-xs text-emerald-600 font-semibold block">
              {enquiriesThisMonth} received this month
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        {/* Confirmed / Completed Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Today's Sessions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-sans">{bookingsConfirmedToday}</span>
              <span className="text-slate-400 text-xs">confirmed</span>
            </div>
            <span className="text-xs text-slate-500 block">
              {sessionsCompletedToday} sessions completed today
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Calendar size={22} />
          </div>
        </div>

        {/* Revenue collected */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Collected Revenue</span>
            <span className="text-2xl font-bold text-emerald-800 font-sans block truncate">{formatGHS(revenueCollectedToday)} <span className="text-xs text-slate-400 font-normal">today</span></span>
            <span className="text-xs text-emerald-600 font-semibold block truncate">
              {formatGHS(revenueCollectedThisMonth)} this month
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Wallet size={22} />
          </div>
        </div>

        {/* Outstanding & Conversion Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Pipeline Strength</span>
            <span className="text-3xl font-bold text-slate-900 font-sans block">{conversionRate}%</span>
            <span className="text-xs text-rose-600 font-semibold block truncate">
              {formatGHS(outstandingPayments)} outstanding GHS
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Percent size={22} />
          </div>
        </div>

      </div>

      {/* Monthly Performance Overview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-emerald-700" size={18} />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Performance Overview ({activeMonthYear})</span>
          </div>
          <p className="text-xs text-slate-500 font-light max-w-sm">
            High-level metrics for the current active month, combining operational capacity and generated net revenue.
          </p>
        </div>
        <div className="flex-1 w-full grid grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider mb-1">Active Bookings</span>
            <span className="text-2xl font-bold text-slate-900 font-sans">{totalActiveBookingsThisMonth}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider mb-1">Therapist Utilization</span>
            <span className="text-2xl font-bold text-slate-900 font-sans">{therapistUtilizationRate}%</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider mb-1">Net Revenue</span>
            <span className="text-xl font-bold text-emerald-800 font-sans truncate" title={formatGHS(netRevenueThisMonth)}>{formatGHS(netRevenueThisMonth)}</span>
          </div>
        </div>
      </div>

      {/* USER REQUEST #1 & #2: HIGH-FIDELITY MARKETING & GOOGLE ACQUISITION ANALYTIC PANEL */}
      <div id="google-search-analytics-banner" className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 p-6 rounded-3xl border border-slate-200">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="text-emerald-700" size={18} />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Google Search Performance Analytics</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Paid Search Ads vs. Organic SEO</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-light">
            Evaluate lead promotion ratios and average GHS yields for customers acquired via paid search clicks versus those landing through organic local search algorithms.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/50">
              <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Search Ads Yield</span>
              <span className="text-lg font-bold text-slate-900 block font-mono">{googleSearchAdsLeads.length} leads</span>
              <span className="text-xs font-bold text-emerald-700 block">{adsConvRate}% Conv. Rate</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/50">
              <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Organic SEO Yield</span>
              <span className="text-lg font-bold text-slate-900 block font-mono">{googleOrganicLeads.length} leads</span>
              <span className="text-xs font-bold text-emerald-700 block">{organicConvRate}% Conv. Rate</span>
            </div>
          </div>
        </div>

        {/* Dynamic Marketing Graphic comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Acquisition Yield comparison</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">Google Channels</span>
              <span className="text-xs text-slate-400">Total Enquiries</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="font-semibold text-slate-700 flex items-center gap-1"><Search size={12} className="text-amber-500" /> Google Search Ads (Paid)</span>
                <span>{googleSearchAdsLeads.length} / {totalLeadsCount} Leads</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all" 
                  style={{ width: `${totalLeadsCount > 0 ? (googleSearchAdsLeads.length / totalLeadsCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="font-semibold text-slate-700 flex items-center gap-1"><Globe size={12} className="text-indigo-600" /> Google Organic Search</span>
                <span>{googleOrganicLeads.length} / {totalLeadsCount} Leads</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all" 
                  style={{ width: `${totalLeadsCount > 0 ? (googleOrganicLeads.length / totalLeadsCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 pt-3 block border-t border-slate-100 italic">
            * Data updated live from local enquiries and ad tracking metrics
          </span>
        </div>
      </div>

      {/* USER REQUEST #3: Line Chart tracking Month-over-Month Revenue growth trends */}
      <div id="mom-revenue-trend-panel" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              <LineIcon className="text-emerald-700" size={18} /> Month-over-Month Revenue Trend
            </h3>
            <p className="text-xs text-slate-400">Evaluating long-term cash collection and invoices to manage growth performance</p>
          </div>
          <button 
            onClick={() => setActiveTab("reports")}
            className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 self-start"
          >
            Detailed Reports <ArrowRight size={14} />
          </button>
        </div>

        <div className="h-72 w-full pt-2">
          {momTrendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">No revenue data available to chart</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={momTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => formatGHS(Number(value))} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="Monthly Invoiced" stroke="#f97316" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Monthly Collected" stroke="#047857" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Main Analytical Section (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recharts Leads by Source (Pie Chart) - 1/3 size */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Leads by Source</h3>
            <p className="text-xs text-slate-400">Distribution of enquiries by origin channel</p>
          </div>
          
          <div className="h-60 w-full flex items-center justify-center">
            {leadsBySourceData.length === 0 ? (
              <span className="text-slate-400 text-xs font-medium">No lead data to display</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadsBySourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} Leads`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {leadsBySourceData.map((data, index) => (
              <div key={data.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                  <span className="text-slate-600 truncate">{data.name}</span>
                </div>
                <span className="font-mono text-slate-800 font-semibold">{data.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recharts Revenue by Customer Area (Bar Chart) - 2/3 size */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">Revenue by Customer Area</h3>
              <p className="text-xs text-slate-400">Total massage transaction volume across Accra areas</p>
            </div>
            <button 
              onClick={() => setActiveTab("bookings")}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Manage Bookings
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            {revenueByAreaData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No revenue data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByAreaData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "#064e3b", borderRadius: "8px", border: "none", color: "#ffffff" }}
                    formatter={(value) => [`${formatGHS(Number(value))}`, "Total Booking Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Upcoming Bookings Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Upcoming Scheduled Sessions</h3>
            <p className="text-xs text-slate-400">Next five mobile appointments sorted chronologically</p>
          </div>
          <button 
            onClick={() => setActiveTab("bookings")}
            className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
          >
            All Bookings <ArrowRight size={14} />
          </button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No bookings recorded
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3">Booking ID</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Service</th>
                  <th className="py-3">Date & Time</th>
                  <th className="py-3">Area & Address</th>
                  <th className="py-3">Therapist</th>
                  <th className="py-3">Final Cost</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {upcomingBookings.map((b, idx) => (
                  <tr key={`dash-book-${b.id || 'none'}-${idx}`} className={`hover:bg-slate-50/50 transition ${b.stage === 'Booking Confirmed' ? 'animate-pulse bg-emerald-50/10' : ''}`}>
                    <td className="py-3 font-semibold font-mono text-emerald-800">{b.id}</td>
                    <td className="py-3 font-medium text-slate-800">{b.customerFirstName} {b.customerLastName}</td>
                    <td className="py-3">{b.serviceName}</td>
                    <td className="py-3 font-mono">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span>{b.appointmentDate} @ {b.appointmentTime}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 max-w-[180px] truncate">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{b.area} ({b.address})</span>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-slate-800">{b.therapist || "Unassigned"}</td>
                    <td className="py-3 font-semibold font-mono text-slate-950">{formatGHS(b.finalAmount)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${
                        b.stage === "Closed Won" ? "bg-emerald-100 text-emerald-800" :
                        b.stage === "Booking Confirmed" ? "bg-amber-100 text-amber-800 animate-pulse" :
                        b.stage === "Therapist Assigned" ? "bg-blue-100 text-blue-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {b.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
