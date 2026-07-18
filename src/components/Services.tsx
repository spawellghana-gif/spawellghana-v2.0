import React, { useState } from "react";
import { getFirebaseErrorMessage } from "../lib/dataService";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Sparkles, 
  Clock, 
  Tag, 
  CheckCircle, 
  XCircle 
} from "lucide-react";
import { Service } from "../types";

interface ServicesProps {
  services: Service[];
  onAdd: (service: Omit<Service, "id">) => Promise<string | void>;
  onUpdate: (id: string, service: Partial<Service>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Services({ services, onAdd, onUpdate, onDelete }: ServicesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(300);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");

  // Helper to format currency in GHS
  const formatGHS = (val: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Filter Services
  const filteredServices = services.filter(s => {
    if (!s || s.isDeleted) return false;

    const name = s.name || "";
    const description = s.description || "";

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "All" ||
      (statusFilter === "Active" && s.isActive) ||
      (statusFilter === "Inactive" && !s.isActive);

    return matchesSearch && matchesStatus;
  });

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingService(null);
    setName("");
    setDuration(60);
    setPrice(350);
    setIsActive(true);
    setDescription("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDuration(service.duration);
    setPrice(service.price);
    setIsActive(service.isActive);
    setDescription(service.description);
    setIsModalOpen(true);
  };

  // Submit Form with unique validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setIsSaving(true);
    if (!name || duration <= 0 || price < 0) {
      setValidationError(getFirebaseErrorMessage("Please provide valid details (Name must be filled, price and duration must be positive)."));
      return;
    }

    // Client-side uniqueness check before hitting backend
    const nameExists = services.some(s => 
      !s.isDeleted && 
      s.name.toLowerCase() === name.trim().toLowerCase() && 
      (!editingService || s.id !== editingService.id)
    );

    if (nameExists) {
      setValidationError(getFirebaseErrorMessage(`Validation Error: A service named "${name.trim()}" already exists in SpaWellGhana CRM. No duplicates allowed!`));
      return;
    }

    const payload = {
      name: name.trim(),
      duration: Number(duration),
      price: Number(price),
      isActive,
      description: description.trim()
    };

    try {
      if (editingService) {
        await onUpdate(editingService.id, payload);
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

  // Delete handler with confirmation
  const handleDelete = async (id: string, serviceName: string) => {
    const isConfirmed = true; // Confirmation removed per requirements
    if (isConfirmed) {
      try {
        await onDelete(id);
      } catch (err: any) {
        setValidationError(getFirebaseErrorMessage("Error deleting service: " + err.message));
      }
    }
  };

  // Quick toggle status handler
  const handleStatusToggle = async (service: Service) => {
    try {
      await onUpdate(service.id, { isActive: !service.isActive });
    } catch (err: any) {
      setValidationError(getFirebaseErrorMessage("Failed to toggle status: " + err.message));
    }
  };

  return (
    <div id="services-tab-container" className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold animate-pulse">
          {successMsg}
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-emerald-700" /> Spa Services Catalog
          </h2>
          <p className="text-xs text-slate-500">Configure standard session durations, GHS pricing, and service descriptions</p>
        </div>
        <button 
          id="services-add-record-btn"
          onClick={handleOpenAdd}
          className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm w-fit self-end md:self-auto"
        >
          <Plus size={16} /> Add Custom Service
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input 
            id="service-search-input"
            type="text"
            placeholder="Search service name, duration or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 transition"
          />
        </div>
        <div className="min-w-[150px]">
          <select
            id="service-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Grid of Services Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            No matching services found in the catalog.
          </div>
        ) : (
          filteredServices.map((service, idx) => (
            <div 
              key={`service-${service.id}-${idx}`}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between space-y-4 shadow-sm transition-all hover:shadow-md ${
                service.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[9px] font-bold text-slate-400 tracking-wider uppercase block">{service.id}</span>
                  <button 
                    onClick={() => handleStatusToggle(service)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border flex items-center gap-1 transition ${
                      service.isActive 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {service.isActive ? (
                      <>
                        <CheckCircle size={10} /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={10} /> Inactive
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm tracking-tight">{service.name}</h3>
                <p className="text-xs text-slate-500 font-light leading-relaxed min-h-[48px] line-clamp-3">
                  {service.description || "No description provided."}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock size={13} className="text-slate-400" />
                    <span className="font-mono font-medium">{service.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-800 text-xs font-semibold">
                    <Tag size={13} className="text-emerald-700" />
                    <span className="font-mono">{formatGHS(service.price)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    title="Edit Service"
                    onClick={() => handleOpenEdit(service)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    title="Delete Service"
                    onClick={() => handleDelete(service.id, service.name)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingService ? "Edit Service Parameters" : "Register New Service"}
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
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  placeholder="e.g. Aromatherapy Swedish Blend"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Duration (minutes) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. 60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Price (GHS) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. 350.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="modal-service-active-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-600"
                />
                <label htmlFor="modal-service-active-toggle" className="text-xs font-semibold text-slate-700">Service is Active (Available for bookings)</label>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1">Service Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  placeholder="Describe benefits, styles, oils used, or specific exclusions..."
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
                  {editingService ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
