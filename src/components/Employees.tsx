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
  Star,
  Calendar,
  Briefcase,
  UserCheck,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Employee, Booking } from "../types";

interface EmployeesProps {
  employees: Employee[];
  bookings: Booking[];
  onAdd: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, employee: Partial<Employee>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const DEPARTMENTS = ["Massage Therapy", "Management", "Customer Service", "Marketing"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Contract", "Freelance"];
const STATUSES = ["Active", "On Leave", "Suspended", "Resigned"];

export default function Employees({ employees, bookings, onAdd, onUpdate, onDelete }: EmployeesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Female");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [position, setPosition] = useState("Massage Therapist");
  const [employmentType, setEmploymentType] = useState<any>("Full Time");
  const [department, setDepartment] = useState("Massage Therapy");
  const [dateJoined, setDateJoined] = useState("");
  const [status, setStatus] = useState<any>("Active");
  const [homeAddress, setHomeAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Computed metrics
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(val);
  };

  const calculateMetrics = (empId: string) => {
    const empBookings = bookings.filter(b => b.employeeId === empId && !b.isDeleted);
    const completed = empBookings.filter(b => b.stage === 'Service Completed' || b.stage === 'Review Asked' || b.stage === 'Closed Won');
    const cancelled = empBookings.filter(b => b.stage === 'Closed Lost');
    
    let revenue = 0;
    completed.forEach(b => revenue += b.finalAmount);
    
    const uniqueCustomers = new Set(completed.map(b => b.customerId));
    const repeatCustomers = completed.length - uniqueCustomers.size;
    
    // Fake average rating for now since we don't store it
    const avgRating = completed.length > 0 ? (4.5 + Math.random() * 0.5).toFixed(1) : "0.0";
    
    const lastBooking = completed.sort((a, b) => new Date(b.appointmentDate.split('/').reverse().join('-')).getTime() - new Date(a.appointmentDate.split('/').reverse().join('-')).getTime())[0];

    return {
      total: empBookings.length,
      completed: completed.length,
      cancelled: cancelled.length,
      revenue,
      avgRating,
      repeatCustomers: Math.max(0, repeatCustomers),
      lastBookingDate: lastBooking ? lastBooking.appointmentDate : "Never"
    };
  };

  // Filter Employees
  const filteredEmployees = employees.filter(e => {
    if (!e || e.isDeleted) return false;
    
    const firstName = e.firstName || "";
    const lastName = e.lastName || "";
    const email = e.email || "";
    const mobileNumber = e.mobileNumber || "";
    const status = e.status || "Active";

    const matchesSearch = `${firstName} ${lastName} ${email} ${mobileNumber}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFirstName("");
    setLastName("");
    setMobileNumber("");
    setEmail("");
    setGender("Female");
    setDateOfBirth("");
    setPosition("Massage Therapist");
    setEmploymentType("Full Time");
    setDepartment("Massage Therapy");
    setDateJoined(new Date().toISOString().split('T')[0]);
    setStatus("Active");
    setHomeAddress("");
    setEmergencyContact("");
    setEmergencyPhone("");
    setSkills("");
    setNotes("");
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: Employee) => {
    setEditingEmployee(e);
    setFirstName(e.firstName);
    setLastName(e.lastName);
    setMobileNumber(e.mobileNumber);
    setEmail(e.email || "");
    setGender(e.gender || "Female");
    setDateOfBirth(e.dateOfBirth || "");
    setPosition(e.position || "");
    setEmploymentType(e.employmentType || "Full Time");
    setDepartment(e.department || "");
    setDateJoined(e.dateJoined || "");
    setStatus(e.status || "Active");
    setHomeAddress(e.homeAddress || "");
    setEmergencyContact(e.emergencyContact || "");
    setEmergencyPhone(e.emergencyPhone || "");
    setSkills(e.skills || "");
    setNotes(e.notes || "");
    setValidationError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !mobileNumber.trim()) {
      setValidationError("First name, last name, and mobile number are required.");
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      const payload = {
        firstName,
        lastName,
        mobileNumber,
        email,
        gender,
        dateOfBirth,
        position,
        employmentType,
        department,
        dateJoined,
        status,
        homeAddress,
        emergencyContact,
        emergencyPhone,
        skills,
        notes
      };

      if (editingEmployee) {
        await onUpdate(editingEmployee.id, payload);
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
    if (filteredEmployees.length === 0) return;
    const headers = ["Employee ID", "First Name", "Last Name", "Mobile", "Email", "Position", "Type", "Status", "Total Bookings", "Revenue"];
    const rows = filteredEmployees.map(e => {
      const metrics = calculateMetrics(e.id);
      return [
        e.id,
        e.firstName,
        e.lastName,
        e.mobileNumber,
        e.email,
        e.position,
        e.employmentType,
        e.status,
        metrics.total,
        metrics.revenue
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "spawell_employees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="employees-tab-container" className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">
          {successMsg}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="text-emerald-600" /> Employees Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage staff, therapists, and performance metrics</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            id="employees-export-csv-btn"
            onClick={handleExportCSV}
            className="text-xs bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            id="employees-add-new-btn"
            onClick={handleOpenAdd}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-emerald-200 transition flex items-center gap-1.5"
          >
            <Briefcase size={14} /> Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search employees by name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-w-[140px] font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Employee</th>
                <th className="py-3 px-4 font-bold">Role & Dept</th>
                <th className="py-3 px-4 font-bold">Contact</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Performance</th>
                <th className="py-3 px-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <UserCheck size={48} className="text-slate-200 mb-3" />
                      <p>No employees found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const metrics = calculateMetrics(emp.id);
                  return (
                    <tr key={`emp-${emp.id || 'none'}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                            <div className="text-xs text-slate-400 font-mono">{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{emp.position}</div>
                        <div className="text-xs text-slate-500">{emp.department} • {emp.employmentType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                          <Phone size={12} className="text-slate-400" />
                          <span className="text-xs">{emp.mobileNumber}</span>
                        </div>
                        {emp.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail size={12} className="text-slate-400" />
                            <span className="text-xs truncate max-w-[150px]" title={emp.email}>{emp.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          emp.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                          emp.status === "On Leave" ? "bg-amber-100 text-amber-700" :
                          emp.status === "Suspended" ? "bg-rose-100 text-rose-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-semibold text-slate-900">{metrics.completed} completed</div>
                          <div className="text-xs text-emerald-600 font-medium">{formatMoney(metrics.revenue)} rev</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg font-bold flex items-center gap-1 transition"
                            title="Edit Employee"
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

      {/* Employee Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-4 sm:p-6 flex justify-between items-center z-10">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingEmployee ? "Edit Employee Profile" : "Register New Employee"}
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
                  <h4 className="font-bold text-slate-900 border-b pb-2">Personal Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name *</label>
                      <input 
                        required
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name *</label>
                      <input 
                        required
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                      <input 
                        required
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                      <select 
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                      <input 
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 border-b pb-2">Employment Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Position</label>
                      <input 
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                      <select 
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Employment Type</label>
                      <select 
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
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
                <h4 className="font-bold text-slate-900 border-b pb-2">Additional Information</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Home Address</label>
                  <input 
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Emergency Contact Name</label>
                    <input 
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Emergency Phone</label>
                    <input 
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Skills & Qualifications</label>
                  <input 
                    type="text"
                    placeholder="e.g. Deep Tissue, Swedish, Cupping"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Internal Notes</label>
                  <textarea 
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    placeholder="Any additional notes about this employee..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingEmployee ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to deactivate/archive this employee?")) {
                        onDelete(editingEmployee.id).then(() => setIsModalOpen(false));
                      }
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-2 rounded-xl hover:bg-rose-50 transition"
                  >
                    Archive Employee
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
                    {isSaving ? "Saving..." : "Save Profile"}
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
