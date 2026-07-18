import React, { useState } from "react";
import { getFirebaseErrorMessage } from "../lib/dataService";
import { 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  X, 
  MapPin, 
  Calendar, 
  FolderHeart,
  TrendingUp,
  History,
  Clock,
  Plus,
  UserPlus
} from "lucide-react";
import { Customer, Booking } from "../types";
import { auth } from "../lib/firebase";
import { createGoogleContact } from "../lib/googleApi";

interface CustomersProps {
  customers: Customer[];
  bookings: Booking[];
  onAdd: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<string | void>;
  onUpdate: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ACCRA_AREAS = [
  "East Legon", "Cantonments", "Labone", "Osu", "Airport Residential", 
  "Roman Ridge", "Spintex", "Dzorwulu", "Dansoman", "Tesano", "Abelemkpe", "Ridge"
];

export default function Customers({ customers, bookings, onAdd, onUpdate, onDelete }: CustomersProps) {
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");

  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("East Legon");
  const [preferredService, setPreferredService] = useState("Relaxation Massage");
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncingContactId, setSyncingContactId] = useState<string | null>(null);

  // Booking History View Modal State
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Helper to format currency in Ghanaian Cedis (GHS)
  const formatGHS = (val: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleSyncContact = async (c: Customer) => {
    try {
      setSyncingContactId(c.id);
      const contactPayload = {
        names: [
          {
            givenName: c.firstName,
            familyName: c.lastName || ""
          }
        ],
        emailAddresses: c.email ? [
          { value: c.email }
        ] : [],
        phoneNumbers: c.phone ? [
          { value: c.phone }
        ] : []
      };
      await createGoogleContact(contactPayload);
      setSuccessToast(`Successfully synced ${c.firstName} to Google Contacts`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setValidationError(getFirebaseErrorMessage(`Failed to sync contact: ${err.message}`));
    } finally {
      setSyncingContactId(null);
    }
  };

  // Filter Customers
  const filteredCustomers = customers.filter(c => {
    if (!c || c.isDeleted) return false;

    const firstName = c.firstName || "";
    const lastName = c.lastName || "";
    const phone = c.phone || "";
    const email = c.email || "";
    const area = c.area || "East Legon";

    const matchesSearch = 
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = areaFilter === "All" || area === areaFilter;

    return matchesSearch && matchesArea;
  });

  // Calculate high-fidelity stats
  const activeCustomers = customers.filter(c => !c.isDeleted);
  const totalLTV = activeCustomers.reduce((sum, c) => sum + (c.lifetimeRevenue || 0), 0);
  const avgLTV = activeCustomers.length > 0 ? totalLTV / activeCustomers.length : 0;
  
  const topCustomer = [...activeCustomers].sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue)[0] || null;

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setArea("East Legon");
    setPreferredService("Relaxation Massage");
    setNotes("");
    setValidationError(null);
    setIsSaving(false);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFirstName(customer.firstName);
    setLastName(customer.lastName);
    setPhone(customer.phone);
    setEmail(customer.email);
    setArea(customer.area);
    setPreferredService(customer.preferredService);
    setNotes(customer.notes);
    setValidationError(null);
    setIsSaving(false);
    setIsModalOpen(true);
  };

  // Submit Customer Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSaving(true);

    // Prevent submission when required fields are empty
    if (!firstName.trim()) {
      setValidationError("First name is required.");
      return;
    }
    if (!phone.trim()) {
      setValidationError("Phone number is required.");
      return;
    }
    if (!area) {
      setValidationError("Customer area is required.");
      return;
    }

    // Before saving a customer, log:
    console.log("SpaWellGhana CRM: auth.currentUser?.uid:", auth.currentUser?.uid);
    console.log("SpaWellGhana CRM: auth.currentUser?.email:", auth.currentUser?.email);
    console.log("SpaWellGhana CRM: Firebase projectId:", "grand-device-rthgf");
    console.log("SpaWellGhana CRM: Exact Firestore collection path:", "customers");

    if (!auth.currentUser) {
      setValidationError("Please sign in");
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(), // Optional
      phone: phone.trim(),
      email: email.trim(),
      area,
      preferredService: preferredService.trim(),
      notes: notes.trim(),
      totalBookings: editingCustomer ? editingCustomer.totalBookings : 0,
      lifetimeRevenue: editingCustomer ? editingCustomer.lifetimeRevenue : 0,
      firstBookingDate: editingCustomer ? editingCustomer.firstBookingDate : undefined,
      lastBookingDate: editingCustomer ? editingCustomer.lastBookingDate : undefined
    };

    setIsSaving(true);
    try {
      if (editingCustomer) {
        await onUpdate(editingCustomer.id, {
          ...payload,
          updatedAt: new Date().toISOString()
        });
        setSuccessToast(`Successfully updated customer profile for ${firstName.trim()} ${lastName.trim()}`.trim());
      } else {
        await onAdd(payload);
        setSuccessToast(`Successfully registered new customer: ${firstName.trim()} ${lastName.trim()}`);
        
        try {
          const contactPayload = {
            names: [{ givenName: firstName.trim(), familyName: lastName.trim() }],
            emailAddresses: email.trim() ? [{ value: email.trim() }] : [],
            phoneNumbers: phone.trim() ? [{ value: phone.trim() }] : []
          };
          await createGoogleContact(contactPayload);
          setSuccessToast(`Successfully registered and synced to Google Contacts: ${firstName.trim()} ${lastName.trim()}`);
        } catch (syncErr) {
          console.error("Failed to auto-sync to contacts", syncErr);
        }
      }
      setIsModalOpen(false);
      // Auto-dismiss the success notification after 5 seconds
      setTimeout(() => {
        setSuccessToast(null);
      }, 5000);
    } catch (err: any) {
      let displayError = err.message;
      try {
        // If it's a JSON-stringified firestore error, parse and display the nested error field
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          displayError = parsed.error;
        }
      } catch (_) {}
      setValidationError("Failed to save customer profile: " + displayError);
    } finally {
      setIsSaving(false);
    }
  };

  // Soft delete confirmation
  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = true; // Confirmation removed per requirements
    if (isConfirmed) {
      try {
        await onDelete(id);
      } catch (err: any) {
        setValidationError(getFirebaseErrorMessage("Error deleting customer: " + err.message));
      }
    }
  };

  // CSV Export for Customers
  const handleExportCSV = () => {
    const activeCust = customers.filter(c => !c.isDeleted);
    if (activeCust.length === 0) {
      setValidationError(getFirebaseErrorMessage("No customer records available to export."));
      return;
    }

    const headers = ["Customer ID", "First Name", "Last Name", "Phone", "Email", "Area", "First Booking Date", "Last Booking Date", "Total Bookings", "Lifetime Spent (GHS)", "Preferred Service", "Notes"];
    const rows = activeCust.map(c => [
      c.id,
      c.firstName,
      c.lastName,
      c.phone,
      c.email,
      c.area,
      c.firstBookingDate || "N/A",
      c.lastBookingDate || "N/A",
      c.totalBookings,
      c.lifetimeRevenue,
      c.preferredService,
      `"${c.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SpawellGhana_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get matching booking records for history viewer
  const getCustomerBookings = (customerId: string) => {
    return bookings.filter(b => b.customerId === customerId && !b.isDeleted);
  };

  return (
    <div id="customers-tab-container" className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">
          {successMsg}
        </div>
      )}

      {successToast && (
        <div id="customers-success-toast" className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in shrink-0">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800 font-bold p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Analytical KPI Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Total Customer Base</span>
            <span className="text-3xl font-bold text-slate-900">{activeCustomers.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <FolderHeart size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Average Lifetime Value</span>
            <span className="text-3xl font-bold text-slate-900">{formatGHS(avgLTV)}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">VIP Top Spender</span>
            <span className="text-sm font-semibold text-slate-800 block truncate">
              {topCustomer ? `${topCustomer.firstName} ${topCustomer.lastName}` : "No clients yet"}
            </span>
            {topCustomer && <span className="text-xs font-mono text-slate-400 font-medium block">Spent: {formatGHS(topCustomer.lifetimeRevenue)}</span>}
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <History size={20} />
          </div>
        </div>
      </div>

      {/* Header and CSV Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderHeart className="text-emerald-700" /> Active Customer Database
          </h2>
          <p className="text-xs text-slate-500 font-light">Monitor booking retention, preferences, and view previous appointment histories</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            id="customers-export-csv-btn"
            onClick={handleExportCSV}
            className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            id="customers-add-record-btn"
            onClick={handleOpenAdd}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus size={16} /> Add Customer Profile
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            id="customer-search-input"
            type="text"
            placeholder="Search customers by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition"
          />
        </div>
        <div className="min-w-[150px]">
          <select
            id="customer-area-filter"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="All">All Neighborhoods</option>
            {ACCRA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No customers registered
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3.5 px-4">Cust ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Phone & Email</th>
                  <th className="py-3.5 px-4">Area</th>
                  <th className="py-3.5 px-4">Booking Activity</th>
                  <th className="py-3.5 px-4">Lifetime Spent</th>
                  <th className="py-3.5 px-4">Preferred Service</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredCustomers.map((cust, idx) => (
                  <tr key={`cust-${cust.id || 'none'}-${idx}`} className="hover:bg-slate-50/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{cust.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {cust.firstName} {cust.lastName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{cust.phone}</span>
                        <span className="block text-[10px] text-slate-400">{cust.email || "No Email"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        {cust.area}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{cust.totalBookings} booking(s)</span>
                        <span className="block text-[9px] text-slate-400">Recent: {cust.lastBookingDate || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold font-mono text-slate-900">
                      {formatGHS(cust.lifetimeRevenue)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-50 text-emerald-800 font-semibold text-[10px] px-2 py-0.5 rounded-lg border border-emerald-100 block w-fit">
                        {cust.preferredService}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          title="Sync to Google Contacts"
                          onClick={() => handleSyncContact(cust)}
                          disabled={syncingContactId === cust.id}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                        >
                          {syncingContactId === cust.id ? <Clock size={14} className="animate-spin" /> : <UserPlus size={14} />}
                        </button>
                        <button
                          title="View Booking History"
                          onClick={() => setHistoryCustomer(cust)}
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg font-bold flex items-center gap-1 transition"
                        >
                          <History size={14} />
                          <span className="text-[10px]">History ({getCustomerBookings(cust.id).length})</span>
                        </button>
                        <button
                          title="Edit Profile"
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          title="Delete Customer Profile"
                          onClick={() => handleDelete(cust.id, `${cust.firstName} ${cust.lastName}`)}
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

      {/* Add / Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCustomer ? "Edit Customer Profile" : "Register New Customer Profile"}
              </h3>
              <button 
                onClick={() => !isSaving && setIsModalOpen(false)}
                disabled={isSaving}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Validation & Error Messages */}
            {validationError && (
              <div id="customer-form-validation-error" className="mx-6 mt-4 p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <span className="shrink-0 font-bold">⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSaving}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                    placeholder="e.g. Akua"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Last Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isSaving}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                    placeholder="e.g. Mansa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isSaving}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                    placeholder="e.g. +233 24 412 3456"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled={isSaving}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                    placeholder="e.g. akua@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Customer Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isSaving}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  >
                    {ACCRA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Preferred Massage</label>
                  <input
                    type="text"
                    disabled={isSaving}
                    value={preferredService}
                    onChange={(e) => setPreferredService(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                    placeholder="e.g. Relaxation Massage"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Client Profile Notes</label>
                <textarea
                  disabled={isSaving}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  placeholder="Notes on physical comfort, preferred scheduling, pressure intensities..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !isAuthInitialized}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                    (isSaving || !isAuthInitialized) ? "bg-emerald-800/60 cursor-not-allowed opacity-80" : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  {!isAuthInitialized ? "Initializing Auth..." : isSaving ? "Saving..." : editingCustomer ? "Update Profile" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Booking History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="text-emerald-700" /> Booking History Log
                </h3>
                <p className="text-xs text-slate-400 font-light">Client: <strong>{historyCustomer.firstName} {historyCustomer.lastName}</strong> ({historyCustomer.id})</p>
              </div>
              <button 
                onClick={() => setHistoryCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {getCustomerBookings(historyCustomer.id).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No historical bookings found for this customer.
                </div>
              ) : (
                <div className="space-y-4">
                  {getCustomerBookings(historyCustomer.id).map((b, idx) => (
                    <div key={`history-booking-${b.id || 'none'}-${idx}`} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-emerald-800">{b.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            b.stage === "Closed Won" ? "bg-emerald-100 text-emerald-800" :
                            b.stage === "Closed Lost" ? "bg-rose-100 text-rose-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {b.stage}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900 text-xs">{b.serviceName}</h4>
                        <div className="text-[11px] text-slate-500 font-mono space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} /> <span>Date: {b.appointmentDate} @ {b.appointmentTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={12} /> <span>Address: {b.area} ({b.address})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} /> <span>Therapist: <strong>{b.therapist || "Unassigned"}</strong></span>
                          </div>
                        </div>
                        {b.notes && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                            "{b.notes}"
                          </p>
                        )}
                        {b.stage === "Closed Lost" && b.lostReason && (
                          <div className="text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100 inline-block font-semibold">
                            Lost Reason: {b.lostReason}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex flex-col justify-between items-end md:w-32">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Final Price</span>
                          <span className="font-mono font-bold text-sm text-slate-950 block">{formatGHS(b.finalAmount)}</span>
                        </div>
                        <div className="text-xs font-mono">
                          <span className="text-emerald-700 block">Paid: {formatGHS(b.amountPaid)}</span>
                          {b.balance > 0 && <span className="text-rose-600 font-semibold block">Balance: {formatGHS(b.balance)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Close History Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
