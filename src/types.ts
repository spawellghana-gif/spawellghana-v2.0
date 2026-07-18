export type LeadSource =
  | 'Google Search Ads'
  | 'Google Organic Search'
  | 'Google Maps'
  | 'Website'
  | 'Facebook'
  | 'Instagram'
  | 'Hotel Partner'
  | 'Corporate Partner'
  | 'Gym Partner'
  | 'Physiotherapy Partner'
  | 'Customer Referral'
  | 'Friend or Family'
  | 'Returning Customer'
  | 'Other';

export type AcquisitionChannel =
  | 'WhatsApp'
  | 'Phone Call'
  | 'Website Form'
  | 'Email';

export type LeadStatus =
  | 'New Enquiry'
  | 'Contacted'
  | 'Qualified'
  | 'Quote Sent'
  | 'Booking Confirmed'
  | 'Customer Created'
  | 'Lost'
  | 'Junk';

export interface Lead {
  id: string; // auto-generated
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  source: LeadSource;
  channel: AcquisitionChannel;
  area: string;
  status: LeadStatus;
  dateReceived: string; // DD/MM/YYYY or YYYY-MM-DD
  notes: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface Customer {
  id: string; // e.g. CUST-1001
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  area: string;
  firstBookingDate?: string; // DD/MM/YYYY
  lastBookingDate?: string; // DD/MM/YYYY
  totalBookings: number;
  lifetimeRevenue: number; // GHS
  preferredService: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface Service {
  id: string; // e.g. SERV-001
  name: string;
  duration: number; // in minutes
  price: number; // GHS
  isActive: boolean;
  description: string;
  isDeleted?: boolean;
}

export type DealStage =
  | 'New Enquiry'
  | 'Qualification'
  | 'Booking Confirmed'
  | 'Therapist Assigned'
  | 'Service Completed'
  | 'Paid'
  | 'Review Asked'
  | 'Closed Won'
  | 'Closed Lost';

export type PaymentStatus =
  | 'Unpaid'
  | 'Deposit Paid'
  | 'Fully Paid'
  | 'Refunded';

export type LostReason =
  | 'Price'
  | 'Customer Cancelled'
  | 'No Response'
  | 'Therapist Unavailable'
  | 'Outside Service Area'
  | 'Scheduling Conflict'
  | 'Chose Competitor'
  | 'Duplicate Booking'
  | 'Other';

export interface Booking {
  id: string; // SPA-YYYY-000001
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  appointmentDate: string; // DD/MM/YYYY
  appointmentTime: string; // HH:MM
  area: string;
  address: string;
  partnerId?: string;
  partnerName?: string;
  employeeId?: string;
  therapist: string;
  stage: DealStage;
  quotedAmount: number; // GHS
  discount: number; // GHS
  travelFee: number; // GHS
  finalAmount: number; // Calculated: quotedAmount - discount + travelFee
  amountPaid: number; // GHS
  balance: number; // Calculated: finalAmount - amountPaid
  paymentStatus: PaymentStatus;
  lostReason?: LostReason;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface UserSession {
  uid: string;
  email: string | null;
  role: 'admin';
}

export type EmploymentType = 'Full Time' | 'Part Time' | 'Contract' | 'Freelance';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Suspended' | 'Resigned';

export interface Employee {
  id: string; // Auto-generated or custom like EMP-001
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  gender: string;
  dateOfBirth: string; // YYYY-MM-DD
  position: string;
  employmentType: EmploymentType;
  department: string;
  dateJoined: string; // YYYY-MM-DD
  status: EmployeeStatus;
  homeAddress: string;
  emergencyContact: string;
  emergencyPhone: string;
  skills: string;
  notes: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export type PartnerType = 'Hotel' | 'Gym' | 'Physiotherapy Clinic' | 'Corporate' | 'Medical' | 'Beauty Salon' | 'Influencer' | 'Concierge' | 'Travel Agency' | 'Other';
export type CommissionType = 'Fixed' | 'Percentage';
export type PartnerStatus = 'Active' | 'Inactive';

export interface Partner {
  id: string; // Auto-generated or custom like PRT-001
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  area: string;
  partnerType: PartnerType;
  commissionPercentage: number; // Used for both fixed amount and percentage based on commissionType
  commissionType: CommissionType;
  status: PartnerStatus;
  dateJoined: string; // YYYY-MM-DD
  notes: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}
