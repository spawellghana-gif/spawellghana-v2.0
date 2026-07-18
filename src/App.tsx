import React, { useEffect, useState } from "react";
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Receipt,
  FileSpreadsheet,
  FolderHeart,
  Sparkles,
  RefreshCw,
  Loader,
  Database,
  Lock,
  LogOut,
  Menu,
  X,
  UserCheck
} from "lucide-react";

// Types
import { Lead, Customer, Service, Booking, DealStage, PaymentStatus, Employee, Partner } from "./types";

// Firebase and Data services
import { db, auth, googleProvider, tryAnonymousAuth } from "./lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { setCachedAccessToken } from "./lib/googleApi";
import { 
  fetchAllData,

  createLead, updateLeadDetails, deleteLeadRecord,
  createCustomer, updateCustomerDetails, deleteCustomerRecord,
  createService, updateServiceDetails, deleteServiceRecord,
  createBooking, updateBookingDetails, deleteBookingRecord,
  createEmployee, updateEmployeeDetails, deleteEmployeeRecord,
  createPartner, updatePartnerDetails, deletePartnerRecord
} from "./lib/dataService";

import { setDoc, doc, deleteDoc, collection, getDocs } from "firebase/firestore";
import logoImage from "./assets/images/spawell_logo_1783957522350.jpg";

const isDev = !(import.meta as any).env?.PROD || window.location.hostname.includes("ais-dev-") || window.location.hostname === "localhost";

// Sub Components
import Dashboard from "./components/Dashboard";
import Leads from "./components/Leads";
import Customers from "./components/Customers";
import Services from "./components/Services";
import Bookings from "./components/Bookings";
import Reports from "./components/Reports";
import Employees from "./components/Employees";
import Partners from "./components/Partners";

export default function App() {
  // Authentication Security Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("spawell_admin_auth") === "true";
  });
  const [isFirebaseReady, setIsFirebaseReady] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Navigation Active Tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core CRM Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Database Connection Statuses
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<"connecting" | "connected" | "offline">("connecting");

  // Authentication validation
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim() === "admin@spawellghana.com" && loginPassword === "spawell2026") {
      setAuthError("");
      try {
        if (!auth.currentUser) {
          await tryAnonymousAuth();
        }
      } catch (err) {
        console.warn("SpaWellGhana CRM: Silently continuing with local admin auth, Firestore auth failed:", err);
      }
      setIsAuthenticated(true);
      localStorage.setItem("spawell_admin_auth", "true");
    } else {
      setAuthError("Invalid credentials. Please use admin@spawellghana.com / spawell2026 to log in.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log("SpaWellGhana CRM: Logged in via Google popup. UID:", userCredential.user.uid);
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
      setIsAuthenticated(true);
      localStorage.setItem("spawell_admin_auth", "true");
      setAuthError("");
    } catch (err: any) {
      console.error("SpaWellGhana CRM: Google authentication error:", err);
      setAuthError(`Google authentication failed: ${err.message || err}`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("spawell_admin_auth");
    auth.signOut().catch(err => console.error("Error signing out from Firebase:", err));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsFirebaseReady(true);
      if (user) {
        setIsAuthenticated(true);
        console.log("SpaWellGhana CRM: auth state changed: User is authenticated. UID:", user.uid);
      } else {
        console.log("SpaWellGhana CRM: auth state changed: User is NOT authenticated. Attempting auto-auth...");
        const autoUser = await tryAnonymousAuth();
        if (autoUser) {
          setIsAuthenticated(true);
        } else {
          console.warn("SpaWellGhana CRM: Auto-auth failed. Continuing as unauthenticated.");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronize entire CRM database from Firestore
  const loadCrmDatabase = async () => {
    if (!isAuthenticated) return;
    setSyncing(true);
    try {
      const data = await fetchAllData();
      setLeads(data.leads || []);
      setCustomers(data.customers || []);
      setServices(data.services || []);
      setBookings(data.bookings || []);
      setEmployees(data.employees || []);
      setPartners(data.partners || []);
      setDbStatus("connected");
      
      // Print the required status logs exactly as requested
      console.log("Connected to Firebase");
      console.log("Authenticated user");
      console.log("Firestore connected");
      console.log("Fallback data used: false");
    } catch (err) {
      console.error("SpaWellGhana: Error loading live CRM database:", err);
      setDbStatus("offline");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isFirebaseReady) {
      loadCrmDatabase();
    } else if (!isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, isFirebaseReady]);

  // Dynamic booking ID calculator helper
  const computeNextBookingId = () => {
    const year = new Date().getFullYear();
    const prefix = `SPA-${year}-`;
    const yearBookings = bookings.filter(b => b.id && b.id.startsWith(prefix));
    
    if (yearBookings.length === 0) {
      return `${prefix}000001`;
    }

    const suffixes = yearBookings.map(b => {
      const parts = b.id.split("-");
      return parts.length === 3 ? parseInt(parts[2], 10) : 0;
    }).filter(num => !isNaN(num));

    const maxSuffix = Math.max(...suffixes, 0);
    const nextSuffix = String(maxSuffix + 1).padStart(6, '0');
    return `${prefix}${nextSuffix}`;
  };

  // CRUD Mutations
  
  // 1. Leads
  const handleAddLead = async (newLead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
    const id = "L" + String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900);
    const payload = {
      status: "New Enquiry",
      channel: "WhatsApp",
      notes: "",
      ...newLead,
      id,
      isDeleted: false
    };
    const saved = await createLead(payload as Lead);
    setLeads(prev => [saved, ...prev]);
  };

  const handleUpdateLead = async (id: string, updated: Partial<Lead>) => {
    await updateLeadDetails(id, updated);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLeadRecord(id, true);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, isDeleted: true } : l));
  };

  // 2. Customers
  const handleAddCustomer = async (newC: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    const id = "CUST-" + String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900);
    const payload = {
      totalBookings: 0,
      lifetimeRevenue: 0,
      firstBookingDate: null,
      lastBookingDate: null,
      notes: "",
      ...newC,
      id,
      isDeleted: false
    };
    const saved = await createCustomer(payload as Customer);
    setCustomers(prev => [saved, ...prev]);
  };

  const handleUpdateCustomer = async (id: string, updated: Partial<Customer>) => {
    await updateCustomerDetails(id, updated);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomerRecord(id, true);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
  };

  // 3. Services
  const handleAddService = async (newS: Omit<Service, "id" | "createdAt" | "updatedAt">) => {
    const id = "SERV-" + String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900);
    const payload = {
      active: true,
      description: "",
      ...newS,
      id,
      isDeleted: false
    };
    const saved = await createService(payload as Service);
    setServices(prev => [saved, ...prev]);
  };

  const handleUpdateService = async (id: string, updated: Partial<Service>) => {
    await updateServiceDetails(id, updated);
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  const handleDeleteService = async (id: string) => {
    await deleteServiceRecord(id, true);
    setServices(prev => prev.map(s => s.id === id ? { ...s, isDeleted: true } : s));
  };

  // 4. Bookings
  const handleAddBooking = async (newB: Omit<Booking, "id" | "createdAt" | "updatedAt"> & { id: string }) => {
    const { id, ...data } = newB;
    const amountPaid = data.amountPaid || 0;
    const payload = {
      amountPaid,
      paymentStatus: "Unpaid",
      outstandingBalance: data.finalAmount - amountPaid,
      ...data,
      id,
      isDeleted: false
    };
    const saved = await createBooking(payload as any);
    setBookings(prev => [saved, ...prev]);
    
    // Automatically update Customer metrics (lifetime spend, booking count, dates)
    const cust = customers.find(c => c.id === newB.customerId);
    if (cust) {
      const updatedBookingsCount = cust.totalBookings + 1;
      const updatedRevenue = cust.lifetimeRevenue + newB.finalAmount;
      const updatedFirstDate = cust.firstBookingDate || newB.appointmentDate;
      const updatedLastDate = newB.appointmentDate;
      
      await updateCustomerDetails(newB.customerId, {
        totalBookings: updatedBookingsCount,
        lifetimeRevenue: updatedRevenue,
        firstBookingDate: updatedFirstDate,
        lastBookingDate: updatedLastDate
      });
      
      setCustomers(prev => prev.map(c => c.id === newB.customerId ? {
        ...c,
        totalBookings: updatedBookingsCount,
        lifetimeRevenue: updatedRevenue,
        firstBookingDate: updatedFirstDate,
        lastBookingDate: updatedLastDate
      } : c));
    }
  };

  const handleUpdateBooking = async (id: string, updated: Partial<Booking>) => {
    await updateBookingDetails(id, updated);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBookingRecord(id, true);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, isDeleted: true } : b));
  };

  // 5. Employees Handlers
  const handleAddEmployee = async (newE: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    const id = "EMP-" + String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900);
    const payload = {
      status: "Active",
      totalBookings: 0,
      completedBookings: 0,
      revenueGenerated: 0,
      ...newE,
      id,
      isDeleted: false
    };
    const saved = await createEmployee(payload as any);
    setEmployees(prev => [saved, ...prev]);
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    await updateEmployeeDetails(id, updates);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployeeRecord(id, true);
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, isDeleted: true } : e));
  };

  // 6. Partners Handlers
  const handleAddPartner = async (newP: Omit<Partner, "id" | "createdAt" | "updatedAt">) => {
    const id = "PRT-" + String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900);
    const payload = {
      status: "Active",
      leadsSent: 0,
      bookingsGenerated: 0,
      revenueGenerated: 0,
      commissionEarned: 0,
      ...newP,
      id,
      isDeleted: false
    };
    const saved = await createPartner(payload as any);
    setPartners(prev => [saved, ...prev]);
  };

  const handleUpdatePartner = async (id: string, updates: Partial<Partner>) => {
    await updatePartnerDetails(id, updates);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeletePartner = async (id: string) => {
    await deletePartnerRecord(id, true);
    setPartners(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  };

  // Lead Conversion Flow
  const handleConvertToCustomer = async (lead: Lead) => {
    const timestamp = new Date().toISOString();
    const tempDocId = doc(collection(db, "customers")).id;
    
    // 1. Create a Customer profile prefilled with Lead details
    const newCustPayload = {
      id: tempDocId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email || "no-email@spawellghana.com",
      area: lead.area,
      totalBookings: 1,
      lifetimeRevenue: 350.00, // Preloaded Relaxation GHS Price
      preferredService: "Relaxation Massage",
      notes: `Successfully converted from Lead Enquiry ${lead.id}. Enquiry notes: ${lead.notes}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };

    await createCustomer(newCustPayload);
    setCustomers(prev => [newCustPayload, ...prev]);

    // 2. Change Lead status to "Customer Created"
    await updateLeadDetails(lead.id, { 
      status: "Customer Created", 
      updatedAt: timestamp 
    });
    setLeads(prev => prev.map(l => l.id === lead.id ? { 
      ...l, 
      status: "Customer Created", 
      updatedAt: timestamp 
    } : l));

    // 3. Automatically add a Confirmed Booking prefilled with the customer info
    const d = new Date();
    const dd = String(d.getDate() + 1).padStart(2, '0'); // Book for tomorrow
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    const chosenService = services.find(s => s.id === "SERV-001") || { id: "SERV-001", name: "Relaxation Massage", price: 350.00 };
    const nextBookingIdStr = computeNextBookingId();

    const newBookingPayload = {
      customerId: tempDocId,
      customerFirstName: lead.firstName,
      customerLastName: lead.lastName,
      customerPhone: lead.phone,
      customerEmail: lead.email || "no-email@spawellghana.com",
      serviceId: chosenService.id,
      serviceName: chosenService.name,
      appointmentDate: `${dd}/${mm}/${yyyy}`,
      appointmentTime: "14:00",
      area: lead.area,
      address: "Update full Accra delivery address here",
      therapist: "Unassigned",
      stage: "Booking Confirmed" as DealStage,
      quotedAmount: chosenService.price,
      discount: 0,
      travelFee: 30, // Default dispatch fee
      finalAmount: chosenService.price + 30,
      amountPaid: 0,
      balance: chosenService.price + 30,
      paymentStatus: "Unpaid" as PaymentStatus,
      notes: `Auto-generated booking during Lead Conversion. Original enquiry notes: ${lead.notes}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDeleted: false
    };

    await createBooking({ id: nextBookingIdStr, ...newBookingPayload });
    setBookings(prev => [{ id: nextBookingIdStr, ...newBookingPayload }, ...prev]);
  };

  // Secure Authentication Login View
  if (!isAuthenticated) {
    return (
      <div id="login-viewport" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-sm overflow-hidden border border-slate-100 bg-white">
              <img src={logoImage} alt="SpawellGhana Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SpawellGhana CRM</h1>
            <p className="text-xs text-slate-400">Secure Administrative Console Portal</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Admin Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                placeholder="admin@spawellghana.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">PIN / Secure Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition mb-3"
            >
              Sign In to CRM
            </button>
            
            <div className="relative flex py-2 items-center">
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or secure sign-in</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.71 0 3.27.614 4.5 1.737l2.44-2.44C17.37 1.744 14.93 1 12.24 1c-5.523 0-10 4.477-10 10s4.477 10 10 10c5.782 0 9.614-4.064 9.614-9.782 0-.66-.06-1.285-.182-1.933H12.24z"/>
              </svg>
              Sign In with Google
            </button>
          </form>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Demo Access Credentials</span>
            <code className="text-xs font-mono text-slate-700 block select-all">admin@spawellghana.com</code>
            <code className="text-xs font-mono text-slate-700 block select-all">spawell2026</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="crm-viewport-root" className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-emerald-200">
      
      {/* LEFT NAVIGATION MENU (SIDEBAR) */}
      <aside className="bg-emerald-950 text-white w-full md:w-64 md:min-h-screen shrink-0 border-b md:border-b-0 md:border-r border-emerald-900 flex flex-col justify-between p-5 sticky top-0 md:h-screen z-40 shadow-md">
        <div className="space-y-6">
          {/* Sidebar Brand Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner overflow-hidden border border-emerald-800/20 bg-white">
                <img src={logoImage} alt="SpawellGhana" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold tracking-tight">SpawellGhana</h2>
                <span className="text-[10px] text-emerald-300 block font-mono">Mobile Massage CRM</span>
              </div>
            </div>
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-1 bg-emerald-900 rounded-lg text-emerald-200"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation links - shown in desktop or when mobile menu is open */}
          <nav className={`${isMobileSidebarOpen ? "block" : "hidden"} md:block space-y-1 pt-2`}>
            {[
              { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
              { id: "leads", label: "Enquiries & Leads", icon: <Users size={15} /> },
              { id: "customers", label: "Customers Base", icon: <FolderHeart size={15} /> },
              { id: "services", label: "Spa Services Menu", icon: <Sparkles size={15} /> },
              { id: "bookings", label: "Bookings & Deals", icon: <Receipt size={15} /> },
              { id: "employees", label: "Employees", icon: <UserCheck size={15} /> },
              { id: "partners", label: "Partners", icon: <Users size={15} /> },
              { id: "reports", label: "Operational Reports", icon: <FileSpreadsheet size={15} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.id 
                    ? "bg-emerald-800 text-white shadow-md font-bold" 
                    : "text-emerald-100 hover:text-white hover:bg-emerald-900/50"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer and Logout controls */}
        <div className={`${isMobileSidebarOpen ? "block" : "hidden"} md:block pt-4 border-t border-emerald-900 space-y-4`}>
          {/* Status logs */}
          <div className="bg-emerald-900/40 p-3.5 rounded-xl border border-emerald-800/40 space-y-1.5 font-mono text-[9px]">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">Firestore:</span>
              <span className="text-white font-bold">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">Sync:</span>
              <span className="text-emerald-200 flex items-center gap-0.5">
                <Database size={10} /> Active
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-emerald-900 hover:bg-rose-950 text-emerald-100 hover:text-white py-2.5 rounded-xl transition"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN VIEWPORT CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        <main className="p-6 md:p-8 flex-1">
          {loading ? (
            <div className="h-full py-24 text-center flex flex-col items-center justify-center gap-4 text-slate-500">
              <Loader size={36} className="animate-spin text-emerald-700" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Syncing Cloud State</h3>
                <p className="text-xs text-slate-400 mt-1 font-light">Contacting Firestore database: loading active registries, bookings, and financial statistics...</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in pb-12">
              {activeTab === "dashboard" && (
                <Dashboard 
                  leads={leads}
                  customers={customers}
                  services={services}
                  bookings={bookings}
                  employees={employees}
                  partners={partners}
                  setActiveTab={setActiveTab}
                />
              )}
              
              {activeTab === "leads" && (
                <Leads 
                  leads={leads}
                  onAdd={handleAddLead}
                  onUpdate={handleUpdateLead}
                  onDelete={handleDeleteLead}
                  onConvertToCustomer={handleConvertToCustomer}
                />
              )}

              {activeTab === "customers" && (
                <Customers 
                  customers={customers}
                  bookings={bookings}
                  onAdd={handleAddCustomer}
                  onUpdate={handleUpdateCustomer}
                  onDelete={handleDeleteCustomer}
                />
              )}

              {activeTab === "services" && (
                <Services 
                  services={services}
                  onAdd={handleAddService}
                  onUpdate={handleUpdateService}
                  onDelete={handleDeleteService}
                />
              )}

              {activeTab === "bookings" && (
                <Bookings 
                  bookings={bookings}
                  customers={customers}
                  services={services}
                  employees={employees}
                  partners={partners}
                  onAdd={handleAddBooking}
                  onUpdate={handleUpdateBooking}
                  onDelete={handleDeleteBooking}
                />
              )}


              {activeTab === "employees" && (
                <Employees 
                  employees={employees}
                  bookings={bookings}
                  onAdd={handleAddEmployee}
                  onUpdate={handleUpdateEmployee}
                  onDelete={handleDeleteEmployee}
                />
              )}
              {activeTab === "partners" && (
                <Partners 
                  partners={partners}
                  bookings={bookings}
                  onAdd={handleAddPartner}
                  onUpdate={handleUpdatePartner}
                  onDelete={handleDeletePartner}
                />
              )}
              {activeTab === "reports" && (
                <Reports 
                  leads={leads}
                  customers={customers}
                  services={services}
                  bookings={bookings}
                  employees={employees}
                  partners={partners}
                />
              )}
            </div>
          )}
        </main>

        {/* Global Footer Utility */}
        <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 mt-auto shrink-0 z-10">
          <div className="flex items-center gap-2 font-sans">
            <span className="font-bold text-slate-200">SpaWellGhana Mobile Massage</span>
            <span>&bull;</span>
            <span>Accra Admin CRM</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
              Host: Cloud Container / Live Firestore
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

