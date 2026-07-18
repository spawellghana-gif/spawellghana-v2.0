import React, { useState } from "react";
import { getFirebaseErrorMessage } from "../lib/dataService";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  UserCheck, 
  Calendar, 
  X,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Users
} from "lucide-react";
import { Lead, LeadSource, AcquisitionChannel, LeadStatus, Customer } from "../types";

interface LeadsProps {
  leads: Lead[];
  onAdd: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Promise<string | void>;
  onUpdate: (id: string, lead: Partial<Lead>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConvertToCustomer: (lead: Lead) => Promise<void>;
}

// Preset arrays for Accra neighborhoods and sources
const ACCRA_AREAS = [
  "East Legon", "Cantonments", "Labone", "Osu", "Airport Residential", 
  "Roman Ridge", "Spintex", "Dzorwulu", "Dansoman", "Tesano", "Abelemkpe", "Ridge"
];

const LEAD_SOURCES: LeadSource[] = [
  "Google Search Ads", "Google Organic Search", "Google Maps", "Website", 
  "Facebook", "Instagram", "Hotel Partner", "Corporate Partner", "Gym Partner", 
  "Physiotherapy Partner", "Customer Referral", "Friend or Family", "Returning Customer", "Other"
];

const CHANNELS: AcquisitionChannel[] = ["WhatsApp", "Phone Call", "Website Form", "Email"];

const STATUSES: LeadStatus[] = [
  "New Enquiry", "Contacted", "Qualified", "Quote Sent", "Booking Confirmed", 
  "Customer Created", "Lost", "Junk"
];

import { fetchGoogleContacts } from "../lib/googleApi";

export default function Leads({ leads, onAdd, onUpdate, onDelete, onConvertToCustomer }: LeadsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [areaFilter, setAreaFilter] = useState<string>("All");

  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  const [isImportingContacts, setIsImportingContacts] = useState(false);

  // Form State

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<LeadSource>("Instagram");
  const [channel, setChannel] = useState<AcquisitionChannel>("WhatsApp");
  const [area, setArea] = useState("East Legon");
  const [status, setStatus] = useState<LeadStatus>("New Enquiry");
  const [dateReceived, setDateReceived] = useState("");
  const [notes, setNotes] = useState("");

  const [isConverting, setIsConverting] = useState<string | null>(null);

  // Filter Leads
  const filteredLeads = leads.filter(lead => {
    if (!lead || lead.isDeleted) return false;

    const firstName = lead.firstName || "";
    const lastName = lead.lastName || "";
    const phone = lead.phone || "";
    const email = lead.email || "";
    const status = lead.status || "New Enquiry";
    const source = lead.source || "Instagram";
    const area = lead.area || "East Legon";

    const matchesSearch = 
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || status === statusFilter;
    const matchesSource = sourceFilter === "All" || source === sourceFilter;
    const matchesArea = areaFilter === "All" || area === areaFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesArea;
  });

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingLead(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setSource("Instagram");
    setChannel("WhatsApp");
    setArea("East Legon");
    setStatus("New Enquiry");
    
    // Set today's date formatted as DD/MM/YYYY
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    setDateReceived(`${dd}/${mm}/${yyyy}`);
    setNotes("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFirstName(lead.firstName);
    setLastName(lead.lastName);
    setPhone(lead.phone);
    setEmail(lead.email || "");
    setSource(lead.source);
    setChannel(lead.channel);
    setArea(lead.area);
    setStatus(lead.status);
    setDateReceived(lead.dateReceived);
    setNotes(lead.notes);
    setIsModalOpen(true);
  };

  // Submit Lead Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSaving(true);
    if (!firstName || !lastName || !phone) {
      setValidationError(getFirebaseErrorMessage("Please fill in all required fields (First name, Last name, Phone number)."));
      return;
    }

    const payload = {
      firstName,
      lastName,
      phone,
      email: email || undefined,
      source,
      channel,
      area,
      status,
      dateReceived,
      notes
    };

    try {
      if (editingLead) {
        await onUpdate(editingLead.id, {
          ...payload,
          updatedAt: new Date().toISOString()
        });
      } else {
        await onAdd(payload);
      }
      setIsModalOpen(false);
      setSuccessMsg("Record saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setValidationError(getFirebaseErrorMessage(err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete handler
  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = true; // Confirmation removed per requirements
    if (isConfirmed) {
      try {
        await onDelete(id);
      } catch (err: any) {
        setValidationError(getFirebaseErrorMessage("Error deleting lead: " + err.message));
      }
    }
  };

  // Convert Qualified Lead to Customer & Booking
  const handleConvert = async (lead: Lead) => {
    setIsConverting(lead.id);
    try {
      await onConvertToCustomer(lead);
      setValidationError(getFirebaseErrorMessage(`Lead ${lead.firstName} ${lead.lastName} successfully converted into Customer database!`));
    } catch (err: any) {
      setValidationError(getFirebaseErrorMessage("Conversion failed: " + err.message));
    } finally {
      setIsConverting(null);
    }
  };

  // CSV Export for Leads
  const handleExportCSV = () => {
    const activeLeads = leads.filter(l => !l.isDeleted);
    if (activeLeads.length === 0) {
      setValidationError(getFirebaseErrorMessage("No lead records available to export."));
      return;
    }

    const headers = ["Lead ID", "First Name", "Last Name", "Phone", "Email", "Source", "Acquisition Channel", "Area", "Status", "Date Received", "Notes"];
    const rows = activeLeads.map(l => [
      l.id,
      l.firstName,
      l.lastName,
      l.phone,
      l.email || "N/A",
      l.source,
      l.channel,
      l.area,
      l.status,
      l.dateReceived,
      `"${l.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SpawellGhana_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportContacts = async () => {
    try {
      setIsImportingContacts(true);
      const data = await fetchGoogleContacts();
      const connections = data.connections || [];
      if (connections.length === 0) {
        setValidationError(getFirebaseErrorMessage("No contacts found in your Google account."));
        return;
      }
      
      const confirmed = window.confirm(`Found ${connections.length} contacts. Do you want to import them as Leads?`);
      if (!confirmed) return;

      let imported = 0;
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const today = `${dd}/${mm}/${yyyy}`;

      for (const contact of connections) {
        const nameObj = contact.names && contact.names.length > 0 ? contact.names[0] : null;
        const phoneObj = contact.phoneNumbers && contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0] : null;
        const emailObj = contact.emailAddresses && contact.emailAddresses.length > 0 ? contact.emailAddresses[0] : null;

        const first = nameObj?.givenName || "Unknown";
        const last = nameObj?.familyName || "";
        const ph = phoneObj?.value || "";
        const em = emailObj?.value || "";

        if (ph || em) { // Only import if we have contact info
          await onAdd({
            firstName: first,
            lastName: last,
            phone: ph || "No Phone",
            email: em,
            source: "Other",
            channel: "Phone Call",
            area: "Unspecified",
            status: "New Enquiry",
            dateReceived: today,
            notes: "Imported from Google Contacts."
          });
          imported++;
        }
      }
      setValidationError(getFirebaseErrorMessage(`Successfully imported ${imported} contacts as Leads!`));
    } catch (err: any) {
      console.error("Error importing contacts:", err);
      setValidationError(getFirebaseErrorMessage(`Failed to import contacts: ${err.message}`));
    } finally {
      setIsImportingContacts(false);
    }
  };

  return (
    <div id="leads-tab-container" className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">
          {successMsg}
        </div>
      )}
      
      {/* Header with quick statistics and CSV buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-emerald-700" /> Lead Pipeline & Enquiries
          </h2>
          <p className="text-xs text-slate-500">Track and convert incoming WhatsApp messages and other enquiry sources</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            id="leads-import-contacts-btn"
            onClick={handleImportContacts}
            disabled={isImportingContacts}
            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-xl font-bold border border-blue-200 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <UserCheck size={14} /> {isImportingContacts ? "Importing..." : "Import Contacts"}
          </button>
          <button 
            id="leads-export-csv-btn"
            onClick={handleExportCSV}
            className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            id="leads-add-record-btn"
            onClick={handleOpenAdd}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus size={16} /> Add New Enquiry
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              id="lead-search-input"
              type="text"
              placeholder="Search enquiries by name, phone or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition"
            />
          </div>
          {/* Status Filter */}
          <div className="min-w-[140px]">
            <select
              id="lead-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Source Filter */}
          <div className="min-w-[140px]">
            <select
              id="lead-source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="All">All Sources</option>
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Area Filter */}
          <div className="min-w-[140px]">
            <select
              id="lead-area-filter"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="All">All Areas</option>
              {ACCRA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No matching leads found. Adjust your filters or click "Add New Enquiry".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3.5 px-4">Date Rec.</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Phone & Email</th>
                  <th className="py-3.5 px-4">Area</th>
                  <th className="py-3.5 px-4">Source & Channel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLeads.map((lead, index) => (
                  <tr key={lead.id ? `${lead.id}-${index}` : `lead-${index}`} className="hover:bg-slate-50/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500">{lead.dateReceived}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{lead.phone}</span>
                        {lead.email && <span className="block text-[10px] text-slate-400">{lead.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        {lead.area}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-slate-800">{lead.source}</span>
                        <span className="block text-[10px] font-mono text-emerald-700">{lead.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${
                        lead.status === "New Enquiry" ? "bg-amber-100 text-amber-800" :
                        lead.status === "Contacted" ? "bg-slate-100 text-slate-700" :
                        lead.status === "Qualified" ? "bg-blue-100 text-blue-800" :
                        lead.status === "Quote Sent" ? "bg-purple-100 text-purple-800" :
                        lead.status === "Booking Confirmed" ? "bg-cyan-100 text-cyan-800" :
                        lead.status === "Customer Created" ? "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300" :
                        "bg-rose-100 text-rose-800"
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate text-slate-500" title={lead.notes}>
                        {lead.notes || <span className="text-slate-300 font-light">No notes</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {/* Convert to Customer button */}
                        {lead.status !== "Customer Created" ? (
                          <button
                            title="Convert to Customer"
                            disabled={isConverting === lead.id}
                            onClick={() => handleConvert(lead)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold flex items-center gap-1 transition"
                          >
                            <UserCheck size={14} />
                            <span className="text-[10px]">Convert</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-0.5 text-emerald-600 font-bold text-[10px] px-1 bg-emerald-50 rounded-lg">
                            <CheckCircle2 size={12} />
                            <span>Converted</span>
                          </div>
                        )}
                        <button
                          title="Edit"
                          onClick={() => handleOpenEdit(lead)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          title="Soft Delete"
                          onClick={() => handleDelete(lead.id, `${lead.firstName} ${lead.lastName}`)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLead ? "Edit Enquiry Record" : "Log New Enquiry"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 mb-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {validationError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. Akua"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. Mansa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. +233 24 412 3456"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. akua@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {LEAD_SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Acquisition Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as AcquisitionChannel)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Accra Neighborhood Area</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {ACCRA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Date Received (DD/MM/YYYY)</label>
                <input
                  type="text"
                  required
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  placeholder="e.g. 13/07/2026"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Conversation Notes / Enquiry Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  placeholder="e.g. Prefers deep pressure on lower back, wants to schedule weekend session..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition"
                >
                  {editingLead ? "Update Record" : "Save Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
