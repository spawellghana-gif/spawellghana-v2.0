import React, { useState, useEffect } from "react";
import { getFirebaseErrorMessage } from "../lib/dataService";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Download, 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle,
  Receipt,
  Wallet,
  Coins,
  Calendar
} from "lucide-react";
import { Booking, Customer, Service, DealStage, PaymentStatus, LostReason } from "../types";

interface BookingsProps {
  bookings: Booking[];
  customers: Customer[];
  services: Service[];
  employees?: any[];
  partners?: any[];
  onAdd: (booking: Omit<Booking, "id" | "createdAt" | "updatedAt"> & { id: string }) => Promise<string | void>;
  onUpdate: (id: string, booking: Partial<Booking>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ACCRA_AREAS = [
  "East Legon", "Cantonments", "Labone", "Osu", "Airport Residential", 
  "Roman Ridge", "Spintex", "Dzorwulu", "Dansoman", "Tesano", "Abelemkpe", "Ridge"
];

const DEAL_STAGES: DealStage[] = [
  "New Enquiry", "Qualification", "Booking Confirmed", "Therapist Assigned", 
  "Service Completed", "Paid", "Review Asked", "Closed Won", "Closed Lost"
];

const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Deposit Paid", "Fully Paid", "Refunded"];

const LOST_REASONS: LostReason[] = [
  "Price", "Customer Cancelled", "No Response", "Therapist Unavailable", 
  "Outside Service Area", "Scheduling Conflict", "Chose Competitor", "Duplicate Booking", "Other"
];



import { createGoogleCalendarEvent } from "../lib/googleApi";

// Defensive Normalize function for Booking documents
export function normalizeBooking(b: any): Booking | null {
  if (!b || typeof b !== "object") return null;
  
  const id = typeof b.id === "string" ? b.id : "";
  if (!id) return null; // Skip records with no id at all

  // Enforce types and provide sensible default values for every field
  const normalized: Booking = {
    id: id,
    customerId: typeof b.customerId === "string" ? b.customerId : "UNKNOWN",
    customerFirstName: typeof b.customerFirstName === "string" ? b.customerFirstName : "Unknown",
    customerLastName: typeof b.customerLastName === "string" ? b.customerLastName : "Customer",
    customerPhone: typeof b.customerPhone === "string" ? b.customerPhone : "",
    customerEmail: typeof b.customerEmail === "string" ? b.customerEmail : "",
    serviceId: typeof b.serviceId === "string" ? b.serviceId : "UNKNOWN",
    serviceName: typeof b.serviceName === "string" ? b.serviceName : "Unknown Service",
    appointmentDate: typeof b.appointmentDate === "string" ? b.appointmentDate : "01/01/2026",
    appointmentTime: typeof b.appointmentTime === "string" ? b.appointmentTime : "00:00",
    area: typeof b.area === "string" ? b.area : "East Legon",
    address: typeof b.address === "string" ? b.address : "Unknown Address",
    partnerId: typeof b.partnerId === "string" ? b.partnerId : "",
    partnerName: typeof b.partnerName === "string" ? b.partnerName : "",
    employeeId: typeof b.employeeId === "string" ? b.employeeId : "",
    therapist: typeof b.therapist === "string" ? b.therapist : "Unassigned",
    stage: (typeof b.stage === "string" && DEAL_STAGES.includes(b.stage as DealStage)) ? (b.stage as DealStage) : "New Enquiry",
    quotedAmount: typeof b.quotedAmount === "number" ? b.quotedAmount : 0,
    discount: typeof b.discount === "number" ? b.discount : 0,
    travelFee: typeof b.travelFee === "number" ? b.travelFee : 0,
    finalAmount: typeof b.finalAmount === "number" ? b.finalAmount : 0,
    amountPaid: typeof b.amountPaid === "number" ? b.amountPaid : 0,
    balance: typeof b.balance === "number" ? b.balance : 0,
    paymentStatus: (typeof b.paymentStatus === "string" && PAYMENT_STATUSES.includes(b.paymentStatus as PaymentStatus)) ? (b.paymentStatus as PaymentStatus) : "Unpaid",
    lostReason: (typeof b.lostReason === "string" && LOST_REASONS.includes(b.lostReason as LostReason)) ? (b.lostReason as LostReason) : undefined,
    notes: typeof b.notes === "string" ? b.notes : "",
    createdAt: typeof b.createdAt === "string" ? b.createdAt : new Date().toISOString(),
    updatedAt: typeof b.updatedAt === "string" ? b.updatedAt : new Date().toISOString(),
    isDeleted: !!b.isDeleted
  };

  // Recalculate auto calculated numbers defensively if needed
  if (normalized.finalAmount === 0 && (normalized.quotedAmount !== 0 || normalized.travelFee !== 0 || normalized.discount !== 0)) {
    normalized.finalAmount = Math.max(0, normalized.quotedAmount - normalized.discount + normalized.travelFee);
  }
  if (normalized.balance === 0 && normalized.finalAmount !== normalized.amountPaid) {
    normalized.balance = Math.max(0, normalized.finalAmount - normalized.amountPaid);
  }

  return normalized;
}

// React Error Boundary to isolate rendering errors of Bookings tab from the rest of the app
export class BookingsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Bookings Module Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 space-y-4 font-sans">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-rose-600 shrink-0" size={24} />
            <div>
              <h3 className="text-sm font-bold">Bookings Module Error</h3>
              <p className="text-xs text-rose-600">An unexpected error occurred while rendering the bookings. Your other CRM data is safe.</p>
            </div>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-rose-100 font-mono text-[10px] text-rose-700 overflow-x-auto max-h-40">
            {this.state.error?.message || "Unknown rendering error"}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Bookings({ bookings = [], customers = [], services = [], employees = [], partners = [], onAdd, onUpdate, onDelete }: BookingsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  // State for Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState<string | null>(null);

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  
  // Client pre-fill overrides (optional edits)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("East Legon");
  const [address, setAddress] = useState("");

  // Session details
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [therapist, setTherapist] = useState("Unassigned");
  const [employeeId, setEmployeeId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [stage, setStage] = useState<DealStage>("New Enquiry");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Unpaid");
  const [lostReason, setLostReason] = useState<LostReason | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // GHS Billing States
  const [quotedAmount, setQuotedAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [travelFee, setTravelFee] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Auto Calculations
  const finalAmount = Math.max(0, quotedAmount - discount + travelFee);
  const balance = Math.max(0, finalAmount - amountPaid);

  // Defensive normalization of the bookings prop list
  const normalizedBookings = React.useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    return bookings
      .map(b => {
        try {
          return normalizeBooking(b);
        } catch (e) {
          console.error("SpaWellGhana: Skipped malformed booking record:", b, e);
          return null;
        }
      })
      .filter((b): b is Booking => b !== null);
  }, [bookings]);

  // Helper to format currency in GHS
  const formatGHS = (val: number) => {
    const num = typeof val === "number" && !isNaN(val) ? val : 0;
    try {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2,
      }).format(num);
    } catch (e) {
      return `GHS ${num.toFixed(2)}`;
    }
  };

  // Generate compliant Booking ID following SPA-YYYY-000001
  const computeNextBookingId = () => {
    const year = new Date().getFullYear();
    const prefix = `SPA-${year}-`;
    const yearBookings = normalizedBookings.filter(b => b.id && b.id.startsWith(prefix));
    
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

  // Handle auto-fill when Customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        setFirstName(cust.firstName);
        setLastName(cust.lastName);
        setPhone(cust.phone);
        setEmail(cust.email);
        setArea(cust.area);
      }
    }
  }, [selectedCustomerId, customers]);

  // Handle auto-fill when Service is selected
  useEffect(() => {
    if (selectedServiceId) {
      const srv = services.find(s => s.id === selectedServiceId);
      if (srv) {
        setQuotedAmount(srv.price);
      }
    }
  }, [selectedServiceId, services]);

  // Filter Bookings list
  const filteredBookings = normalizedBookings.filter(b => {
    if (b.isDeleted) return false;

    // Use safe fallbacks with optional chaining / safe variables
    const id = b.id || "";
    const firstName = b.customerFirstName || "";
    const lastName = b.customerLastName || "";
    const phone = b.customerPhone || "";
    const serviceName = b.serviceName || "";
    const therapist = b.therapist || "";

    const matchesSearch = 
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === "All" || b.stage === stageFilter;
    const matchesPayment = paymentFilter === "All" || b.paymentStatus === paymentFilter;

    return matchesSearch && matchesStage && matchesPayment;
  });

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingBooking(null);
    setSelectedCustomerId("");
    setSelectedServiceId("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setArea("East Legon");
    setAddress("");
    
    // Set date input to today
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    setAppointmentDate(`${dd}/${mm}/${yyyy}`);
    setAppointmentTime("10:00");
    setTherapist("Unassigned");
    setEmployeeId("");
    setPartnerId("");
    setStage("New Enquiry");
    setPaymentStatus("Unpaid");
    setLostReason(undefined);
    setNotes("");

    setQuotedAmount(0);
    setDiscount(0);
    setTravelFee(30); // Default local Accra dispatch fee
    setAmountPaid(0);

    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (b: Booking) => {
    setEditingBooking(b);
    setSelectedCustomerId(b.customerId || "");
    setSelectedServiceId(b.serviceId || "");
    setFirstName(b.customerFirstName || "");
    setLastName(b.customerLastName || "");
    setPhone(b.customerPhone || "");
    setEmail(b.customerEmail || "");
    setArea(b.area || "East Legon");
    setAddress(b.address || "");
    setAppointmentDate(b.appointmentDate || "");
    setAppointmentTime(b.appointmentTime || "");
    setTherapist(b.therapist || "Unassigned");
    setEmployeeId(b.employeeId || "");
    setPartnerId(b.partnerId || "");
    setStage(b.stage || "New Enquiry");
    setPaymentStatus(b.paymentStatus || "Unpaid");
    setLostReason(b.lostReason);
    setNotes(b.notes || "");

    setQuotedAmount(b.quotedAmount || 0);
    setDiscount(b.discount || 0);
    setTravelFee(b.travelFee || 0);
    setAmountPaid(b.amountPaid || 0);

    setIsModalOpen(true);
  };

  // Submit Booking transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSaving(true);
    if (!selectedCustomerId || !selectedServiceId || !appointmentDate || !appointmentTime || !address) {
      setValidationError(getFirebaseErrorMessage("Please ensure Customer, Service, Date, Time, and Full address are provided."));
      return;
    }

    const srv = services.find(s => s.id === selectedServiceId);
    const serviceName = srv ? srv.name : "Custom Massage";

    // Find assigned employee details if therapist is not "Unassigned"
    let assignedEmployeeId = "";
    if (therapist !== "Unassigned") {
      const emp = (employees || []).find(e => `${e.firstName} ${e.lastName}` === therapist);
      if (emp) {
        assignedEmployeeId = emp.id;
      }
    }

    // Find assigned partner details
    let assignedPartnerName = "";
    if (partnerId) {
      const prt = (partners || []).find(p => p.id === partnerId);
      if (prt) {
        assignedPartnerName = prt.businessName;
      }
    }

    const payload = {
      customerId: selectedCustomerId,
      customerFirstName: firstName,
      customerLastName: lastName,
      customerPhone: phone,
      customerEmail: email,
      serviceId: selectedServiceId,
      serviceName,
      appointmentDate,
      appointmentTime,
      area,
      address,
      therapist,
      employeeId: assignedEmployeeId,
      partnerId: partnerId || "",
      partnerName: assignedPartnerName,
      stage,
      quotedAmount: Number(quotedAmount),
      discount: Number(discount),
      travelFee: Number(travelFee),
      finalAmount,
      amountPaid: Number(amountPaid),
      balance,
      paymentStatus,
      lostReason: stage === "Closed Lost" ? lostReason : undefined,
      notes
    };

    try {
      // Simulate SMS notification
      if (stage === "Booking Confirmed") {
        const isNewConfirmation = !editingBooking || editingBooking.stage !== "Booking Confirmed";
        if (isNewConfirmation) {
          console.log(`[SMS Notification Sent] Hello ${firstName}, your SpaWell booking for ${serviceName} on ${appointmentDate} at ${appointmentTime} is confirmed. See you soon!`);
        }
      }

      if (editingBooking) {
        await onUpdate(editingBooking.id, {
          ...payload,
          updatedAt: new Date().toISOString()
        });
      } else {
        const nextId = computeNextBookingId();
        await onAdd({
          ...payload,
          id: nextId
        });
      }
      setIsModalOpen(false);
      setSuccessMsg("Record saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setValidationError(getFirebaseErrorMessage("Booking failed to save: " + err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Soft deletion handler
  const handleDelete = async (id: string) => {
    const isConfirmed = true; // Confirmation removed per requirements
    if (isConfirmed) {
      try {
        await onDelete(id);
      } catch (err: any) {
        setValidationError(getFirebaseErrorMessage("Error deleting booking: " + err.message));
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const activeBookings = normalizedBookings.filter(b => !b.isDeleted);
    if (activeBookings.length === 0) {
      setValidationError(getFirebaseErrorMessage("No active bookings to export."));
      return;
    }

    const headers = [
      "Booking ID", "Customer ID", "Customer Name", "Phone", "Email", "Service ID", "Service Name", 
      "Date", "Time", "Area", "Full Address", "Therapist", "Stage", "Quoted GHS", "Discount GHS", 
      "Travel GHS", "Final Amount GHS", "Paid GHS", "Outstanding Balance GHS", "Payment Status", "Lost Reason", "Notes"
    ];

    const rows = activeBookings.map(b => {
      const id = b.id || "";
      const customerId = b.customerId || "";
      const firstName = b.customerFirstName || "";
      const lastName = b.customerLastName || "";
      const phone = b.customerPhone || "";
      const email = b.customerEmail || "";
      const serviceId = b.serviceId || "";
      const serviceName = b.serviceName || "";
      const appointmentDate = b.appointmentDate || "";
      const appointmentTime = b.appointmentTime || "";
      const area = b.area || "";
      const address = b.address || "";
      const therapist = b.therapist || "Unassigned";
      const stage = b.stage || "New Enquiry";
      const quotedAmount = b.quotedAmount || 0;
      const discount = b.discount || 0;
      const travelFee = b.travelFee || 0;
      const finalAmount = b.finalAmount || 0;
      const amountPaid = b.amountPaid || 0;
      const balance = b.balance || 0;
      const paymentStatus = b.paymentStatus || "Unpaid";
      const lostReason = b.lostReason || "N/A";
      const notes = b.notes || "";

      return [
        id,
        customerId,
        `"${firstName} ${lastName}"`,
        phone,
        email || "N/A",
        serviceId,
        serviceName,
        appointmentDate,
        appointmentTime,
        area,
        `"${address.replace(/"/g, '""')}"`,
        therapist,
        stage,
        quotedAmount,
        discount,
        travelFee,
        finalAmount,
        amountPaid,
        balance,
        paymentStatus,
        lostReason,
        `"${notes.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SpawellGhana_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddToCalendar = async (b: Booking) => {
    try {
      setIsAddingToCalendar(b.id);
      
      const appointmentDate = b.appointmentDate || "";
      const appointmentTime = b.appointmentTime || "";
      const parts = appointmentDate.split("/");
      if (parts.length !== 3) {
        setValidationError(getFirebaseErrorMessage("Invalid appointment date or time. Please ensure it's in DD/MM/YYYY HH:MM format."));
        return;
      }
      const [dd, mm, yyyy] = parts;
      const startDateTime = new Date(`${yyyy}-${mm}-${dd}T${appointmentTime || "10:00"}:00`);
      if (isNaN(startDateTime.getTime())) {
        setValidationError(getFirebaseErrorMessage("Invalid appointment date or time. Please ensure it's in DD/MM/YYYY HH:MM format."));
        return;
      }
      
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Assume 1 hour session
      
      const event = {
        summary: `SpaWell: ${b.serviceName || "Spa Session"} for ${b.customerFirstName || "Customer"}`,
        location: b.address || "",
        description: `Customer: ${b.customerFirstName || ""} ${b.customerLastName || ""}\nPhone: ${b.customerPhone || ""}\nTherapist: ${b.therapist || "Unassigned"}\nNotes: ${b.notes || ""}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await createGoogleCalendarEvent(event);
      setValidationError(getFirebaseErrorMessage(`Successfully added booking ${b.id} to Google Calendar!`));
    } catch (err: any) {
      console.error("Error adding to calendar:", err);
      setValidationError(getFirebaseErrorMessage(`Failed to add to calendar: ${err.message}`));
    } finally {
      setIsAddingToCalendar(null);
    }
  };

  return (
    <div id="bookings-tab-container" className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">
          {successMsg}
        </div>
      )}

      {/* Header and CSV buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="text-emerald-700" /> Mobile Bookings & Deals
          </h2>
          <p className="text-xs text-slate-500">Log appointment dates, assign Accra therapists, track pipeline stages, and manage balances</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            id="bookings-export-csv-btn"
            onClick={handleExportCSV}
            className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            id="bookings-add-record-btn"
            onClick={handleOpenAdd}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus size={16} /> New Booking Transaction
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            id="booking-search-input"
            type="text"
            placeholder="Search bookings by ID, customer name, phone, service, therapist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition"
          />
        </div>
        <div className="min-w-[150px]">
          <select
            id="booking-stage-filter"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="All">All Deal Stages</option>
            {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="min-w-[150px]">
          <select
            id="booking-payment-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="All">All Payment States</option>
            {PAYMENT_STATUSES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No bookings recorded
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Area & Therapist</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4">Total GHS</th>
                  <th className="py-3.5 px-4">Paid & Balance</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredBookings.map((b, idx) => (
                  <tr key={`booking-${b.id || 'none'}-${idx}`} className={`hover:bg-slate-50/30 transition ${b.stage === 'Booking Confirmed' ? 'animate-pulse bg-emerald-50/10' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-emerald-800">{b.id}</span>
                        <span className="block text-[8px] text-slate-400 font-mono">Cust: {b.customerId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="space-y-0.5">
                        <span>{b.customerFirstName} {b.customerLastName}</span>
                        <span className="block text-[10px] text-slate-500 font-normal">{b.customerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{b.serviceName}</td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-mono">
                        <span className="text-slate-700 block font-semibold">{b.appointmentDate}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Clock size={11} /> {b.appointmentTime}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-medium">
                        <span className="text-slate-800 block flex items-center gap-0.5">
                          <MapPin size={11} className="text-slate-400" /> {b.area}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">Therapist: <strong>{b.therapist || "Unassigned"}</strong></span>
                        {b.partnerName && (
                          <span className="text-[10px] text-emerald-600 font-normal block">Partner: <strong>{b.partnerName}</strong></span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide block w-fit ${
                          b.stage === "Closed Won" ? "bg-emerald-100 text-emerald-800" :
                          b.stage === "Closed Lost" ? "bg-rose-100 text-rose-800 font-semibold" :
                          b.stage === "Booking Confirmed" ? "bg-amber-100 text-amber-800 animate-pulse" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {b.stage}
                        </span>
                        {b.stage === "Closed Lost" && b.lostReason && (
                          <span className="text-[9px] text-rose-600 font-mono block font-semibold">Reason: {b.lostReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold font-mono text-slate-900">
                      {formatGHS(b.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-mono text-[10px]">
                        <span className="text-emerald-700 block">Paid: {formatGHS(b.amountPaid)}</span>
                        {b.balance > 0 ? (
                          <span className="text-rose-600 block font-semibold">Bal: {formatGHS(b.balance)}</span>
                        ) : (
                          <span className="text-emerald-600 block font-semibold">Settled</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Add to Google Calendar"
                          onClick={() => handleAddToCalendar(b)}
                          disabled={isAddingToCalendar === b.id}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                        >
                          {isAddingToCalendar === b.id ? <Clock size={14} className="animate-spin" /> : <Calendar size={14} />}
                        </button>
                        <button
                          title="Edit Booking"
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          title="Delete Booking"
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBooking ? `Edit Booking Session: ${editingBooking.id}` : "Log Mobile Spa Booking"}
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
              
              {/* Step 1: Matching references */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Select Customer Profile *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.filter(c => !c.isDeleted).map(c => (
                      <option key={c.id} value={c.id}>{c.id} - {c.firstName} {c.lastName} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Select Spa Service *</label>
                  <select
                    required
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Choose Service --</option>
                    {services.filter(s => !s.isDeleted && s.isActive).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({formatGHS(s.price)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Contact parameters validation */}
              {selectedCustomerId && (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Validated Customer Details</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Name</span>
                      <strong className="text-slate-800">{firstName} {lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone</span>
                      <strong className="text-slate-800">{phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Neighborhood</span>
                      <strong className="text-slate-800">{area}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <strong className="text-slate-800 truncate block">{email || "N/A"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Dispatch & Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Appointment Date *</label>
                  <input
                    type="text"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Appointment Time *</label>
                  <input
                    type="text"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    placeholder="HH:MM"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Assign Therapist</label>
                  <select
                    value={therapist}
                    onChange={(e) => setTherapist(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {(employees || []).filter(e => !e.isDeleted).map(th => <option key={th.id} value={`${th.firstName} ${th.lastName}`}>{th.firstName} {th.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Referral Partner</label>
                  <select
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">None / Direct</option>
                    {(partners || []).filter(p => !p.isDeleted).map(p => (
                      <option key={p.id} value={p.id}>{p.businessName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Full Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  placeholder="Street name, landmark details, apartment no. in Accra"
                />
              </div>

              {/* Step 4: Sales Pipeline & Deal stages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Deal Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as DealStage)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {DEAL_STAGES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  >
                    {PAYMENT_STATUSES.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                  </select>
                </div>
              </div>

              {/* Conditional rendering for Closed Lost reason ONLY */}
              {stage === "Closed Lost" && (
                <div id="booking-lost-reason-container" className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                  <label className="block text-[11px] font-bold uppercase text-rose-700 tracking-wider mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} /> Select Closed Lost Reason *
                  </label>
                  <select
                    required
                    value={lostReason || ""}
                    onChange={(e) => setLostReason(e.target.value as LostReason)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:border-rose-600 text-rose-900 font-semibold"
                  >
                    <option value="">-- Select Reason --</option>
                    {LOST_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {/* Step 5: Real-time Billing & Calculations */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GHS Financial Breakdown & Calculations</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Quoted GHS</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={quotedAmount}
                      onChange={(e) => setQuotedAmount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Discount GHS</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Travel Dispatch GHS</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={travelFee}
                      onChange={(e) => setTravelFee(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Amount Paid GHS</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-blue-800"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Receipt size={14} className="text-slate-400" />
                    <span>Final Calculated Bill: <strong className="text-slate-900">{formatGHS(finalAmount)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins size={14} className="text-slate-400" />
                    <span>Calculated Balance: <strong className={balance > 0 ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>{formatGHS(balance)}</strong></span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Booking Notes / Specific Requests</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  placeholder="Notes on oils used, physical limits, gated estate codes..."
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
                  {editingBooking ? "Update Booking" : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Wrap with Error Boundary to keep rendering robust and separate failure domains
export default function BookingsWithErrorBoundary(props: BookingsProps) {
  return (
    <BookingsErrorBoundary>
      <Bookings {...props} />
    </BookingsErrorBoundary>
  );
}
