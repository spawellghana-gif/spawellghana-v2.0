import React, { useState } from "react";
import { getFirebaseErrorMessage } from "../lib/dataService";
import { 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Download, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase,
  Users,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Partner, Booking } from "../types";

interface PartnersProps {
  partners: Partner[];
  bookings: Booking[];
  onAdd: (partner: Omit<Partner, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, partner: Partial<Partner>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PARTNER_TYPES = [
  "Hotel", "Gym", "Physiotherapy Clinic", "Corporate", 
  "Medical", "Beauty Salon", "Influencer", "Concierge", 
  "Travel Agency", "Other"
];
const COMMISSION_TYPES = ["Fixed", "Percentage"];
const STATUSES = ["Active", "Inactive"];

export default function Partners({ partners, bookings, onAdd, onUpdate, onDelete }: PartnersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  
  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [partnerType, setPartnerType] = useState<any>("Hotel");
  const [commissionPercentage, setCommissionPercentage] = useState<number>(0);
  const [commissionType, setCommissionType] = useState<any>("Percentage");
  const [status, setStatus] = useState<any>("Active");
  const [dateJoined, setDateJoined] = useState("");
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to determine if a date is in current quarter
  const isCurrentQuarter = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== "string" || !dateStr.includes("/")) return false;
    const parts = dateStr.split("/");
    if (parts.length < 3) return false;
    const [dayStr, monthStr, yearStr] = parts;
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (isNaN(month) || isNaN(year)) return false;
    
    const d = new Date();
    const currentMonth = d.getMonth() + 1; // 1-12
    const currentYear = d.getFullYear();
    const currentQuarter = Math.ceil(currentMonth / 3);
    const dateQuarter = Math.ceil(month / 3);
    
    return year === currentYear && currentQuarter === dateQuarter;
  };

  const currentQuarterString = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

  // Computed metrics
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(val);
  };

  const calculateMetrics = (partnerId: string) => {
    const partnerBookings = bookings.filter(b => b.partnerId === partnerId && !b.isDeleted);
    const completed = partnerBookings.filter(b => b.stage === 'Service Completed' || b.stage === 'Review Asked' || b.stage === 'Closed Won');
    const cancelled = partnerBookings.filter(b => b.stage === 'Closed Lost');
    
    let revenue = 0;
    completed.forEach(b => revenue += b.finalAmount);
    
    const partner = partners.find(p => p.id === partnerId);
    let commissionEarned = 0;
    if (partner) {
      if (partner.commissionType === "Percentage") {
        commissionEarned = (revenue * partner.commissionPercentage) / 100;
      } else {
        commissionEarned = completed.length * partner.commissionPercentage;
      }
    }
    
    // Fake leads sent for now since we don't link leads to partners directly yet
    const leadsSent = partnerBookings.length + Math.floor(Math.random() * 5); 
    const conversionRate = leadsSent > 0 ? Math.round((completed.length / leadsSent) * 100) : 0;
    
    const lastBooking = completed.sort((a, b) => new Date(b.appointmentDate.split('/').reverse().join('-')).getTime() - new Date(a.appointmentDate.split('/').reverse().join('-')).getTime())[0];

    return {
      leadsSent,
      totalBookings: partnerBookings.length,
      completedBookings: completed.length,
      revenue,
      commissionEarned,
      conversionRate,
      lastReferralDate: lastBooking ? lastBooking.appointmentDate : "Never"
    };
  };

  // Filter Partners
  const filteredPartners = partners.filter(p => {
    if (!p || p.isDeleted) return false;
    
    const businessName = p.businessName || "";
    const contactPerson = p.contactPerson || "";
    const email = p.email || "";
    const phone = p.phone || "";
    const partnerType = p.partnerType || "Hotel";

    const matchesSearch = `${businessName} ${contactPerson} ${email} ${phone}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || partnerType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingPartner(null);
    setBusinessName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setArea("");
    setPartnerType("Hotel");
    setCommissionPercentage(10);
    setCommissionType("Percentage");
    setStatus("Active");
    setDateJoined(new Date().toISOString().split('T')[0]);
    setNotes("");
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Partner) => {
    setEditingPartner(p);
    setBusinessName(p.businessName);
    setContactPerson(p.contactPerson);
    setPhone(p.phone);
    setEmail(p.email || "");
    setArea(p.area || "");
    setPartnerType(p.partnerType || "Hotel");
    setCommissionPercentage(p.commissionPercentage || 0);
    setCommissionType(p.commissionType || "Percentage");
    setStatus(p.status || "Active");
    setDateJoined(p.dateJoined || "");
    setNotes(p.notes || "");
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !contactPerson.trim() || !phone.trim()) {
      setValidationError("Business name, contact person, and phone are required.");
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      const payload = {
        businessName,
        contactPerson,
        phone,
        email,
        area,
        partnerType,
        commissionPercentage: Number(commissionPercentage),
        commissionType,
        status,
        dateJoined,
        notes
      };

      if (editingPartner) {
        await onUpdate(editingPartner.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsModalOpen(false);
      setSuccessMsg("Record saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setValidationError(getFirebaseErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredPartners.length === 0) return;
    const headers = ["Partner ID", "Business Name", "Contact Person", "Phone", "Type", "Commission", "Status", "Bookings", "Revenue", "Commission Earned"];
    const rows = filteredPartners.map(p => {
      const metrics = calculateMetrics(p.id);
      return [
        p.id,
        p.businessName,
        p.contactPerson,
        p.phone,
        p.partnerType,
        `${p.commissionPercentage}${p.commissionType === 'Percentage' ? '%' : ' GHS'}`,
        p.status,
        metrics.completedBookings,
        metrics.revenue,
        metrics.commissionEarned
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spawell_partners.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quarterly stats per partner
  const getQuarterlyStats = () => {
    return partners.filter(p => !p.isDeleted).map(p => {
      const currentQuarterBookings = bookings.filter(b => 
        b.partnerId === p.id && 
        !b.isDeleted && 
        isCurrentQuarter(b.appointmentDate)
      );

      const completed = currentQuarterBookings.filter(b => b.stage === 'Service Completed' || b.stage === 'Review Asked' || b.stage === 'Closed Won' || b.stage === 'Paid');

      let revenue = 0;
      completed.forEach(b => revenue += (b.finalAmount || 0));

      return {
        id: p.id,
        name: p.businessName,
        type: p.partnerType,
        leads: currentQuarterBookings.length, 
        completed: completed.length,
        revenue: revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  return (
    <div id="partners-tab-container" className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">
          {successMsg}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-600" /> Partner Network
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage referral partners and calculate commissions</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            id="partners-quarterly-summary-btn"
            onClick={() => setIsSummaryModalOpen(true)}
            className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <CheckCircle size={14} /> Quarterly Summary
          </button>
          <button 
            id="partners-export-csv-btn"
            onClick={handleExportCSV}
            className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            id="partners-add-new-btn"
            onClick={handleOpenAdd}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-emerald-200 transition flex items-center gap-1.5"
          >
            <Briefcase size={14} /> Register Partner
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by business name, contact, or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-w-[140px] font-medium text-slate-700"
          >
            <option value="All">All Types</option>
            {PARTNER_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Partner Details</th>
                <th className="py-3 px-4 font-bold">Contact Info</th>
                <th className="py-3 px-4 font-bold">Commission</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Performance</th>
                <th className="py-3 px-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={48} className="text-slate-200 mb-3" />
                      <p>No partners found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPartners.map((part, idx) => {
                  const metrics = calculateMetrics(part.id);
                  return (
                    <tr key={`part-${part.id || 'none'}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{part.businessName}</div>
                        <div className="text-xs text-slate-500">{part.partnerType} • {part.area}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{part.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{part.contactPerson}</div>
                        <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                          <Phone size={10} className="text-slate-400" />
                          <span className="text-xs">{part.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-700">
                          {part.commissionType === "Percentage" ? `${part.commissionPercentage}%` : formatMoney(part.commissionPercentage)}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">{part.commissionType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          part.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {part.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-semibold text-slate-900">{metrics.completedBookings} bookings</div>
                          <div className="text-[10px] text-emerald-600 font-medium">Earned: {formatMoney(metrics.commissionEarned)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(part)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg font-bold flex items-center gap-1 transition"
                            title="Edit Partner"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quarterly Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Quarterly Performance Summary</h3>
                <p className="text-sm text-slate-500 mt-1">Aggregated booking data for {currentQuarterString}</p>
              </div>
              <button 
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold">Partner Name</th>
                    <th className="py-3 px-4 font-bold text-center">Type</th>
                    <th className="py-3 px-4 font-bold text-center">Leads (Total Bookings)</th>
                    <th className="py-3 px-4 font-bold text-center">Completed</th>
                    <th className="py-3 px-4 font-bold text-right">Quarterly Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getQuarterlyStats().map((stat, idx) => (
                    <tr key={stat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{stat.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {stat.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                        {stat.leads}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                        {stat.completed}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatMoney(stat.revenue)}
                      </td>
                    </tr>
                  ))}
                  {getQuarterlyStats().length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No partner data available for this quarter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Partner Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-4 sm:p-6 flex justify-between items-center z-10">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingPartner ? "Edit Partner Profile" : "Register New Partner"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Business Details</h4>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business Name *</label>
                    <input 
                      required
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Partner Type</label>
                      <select 
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Area / Location</label>
                      <input 
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date Joined</label>
                      <input 
                        type="date"
                        value={dateJoined}
                        onChange={(e) => setDateJoined(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Contact & Financials</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Person *</label>
                      <input 
                        required
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                      <input 
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Commission Type</label>
                      <select 
                        value={commissionType}
                        onChange={(e) => setCommissionType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {COMMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Commission Value</label>
                      <div className="relative">
                        <input 
                          type="number"
                          min="0"
                          step={commissionType === "Percentage" ? "1" : "0.01"}
                          value={commissionPercentage}
                          onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          {commissionType === "Percentage" ? "%" : "₵"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 border-b pb-2">Internal Notes</h4>
                <div>
                  <textarea 
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    placeholder="Agreements, preferred communication style, etc..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingPartner ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to deactivate/archive this partner?")) {
                        onDelete(editingPartner.id).then(() => setIsModalOpen(false));
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-2 rounded-xl hover:bg-rose-50 transition"
                  >
                    Archive Partner
                  </button>
                ) : (
                  <div />
                )}
                
                <div className="flex gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-70 flex items-center gap-2"
                  >
                    {isSaving ? "Saving..." : "Save Partner"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
