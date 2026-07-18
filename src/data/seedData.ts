import { Lead, Customer, Service, Booking } from "../types";

export const SEED_SERVICES: Service[] = [
  {
    id: "SERV-001",
    name: "Relaxation Massage",
    price: 500,
    duration: 60,
    isActive: true,
    description: "A gentle full-body massage designed to promote deep relaxation, improve circulation, and relieve minor muscle tension using premium Ghanaian organic oils."
  },
  {
    id: "SERV-002",
    name: "Aromatherapy",
    price: 400,
    duration: 75,
    isActive: true,
    description: "Therapeutic massage session incorporating natural essential oils extracted from native flora, formulated to alleviate stress and elevate mental clarity."
  },
  {
    id: "SERV-003",
    name: "Full Body Massage",
    price: 450,
    duration: 90,
    isActive: true,
    description: "Comprehensive head-to-toe session targeting persistent muscle nodes. Promotes full body rejuvenation and relieves travel or stress fatigue."
  },
  {
    id: "SERV-004",
    name: "Swedish Massage",
    price: 380,
    duration: 60,
    isActive: true,
    description: "Classic European style utilizing long flowing strokes, kneading, and friction techniques to enhance oxygen flow and release general stiffness."
  },
  {
    id: "SERV-005",
    name: "Deep Tissue Massage",
    price: 500,
    duration: 90,
    isActive: true,
    description: "Intense pressure application focusing on deep layers of muscle and connective tissue. Highly recommended for chronic tension or active athletic recovery."
  }
];

export const SEED_LEADS: Lead[] = [];

export const SEED_CUSTOMERS: Customer[] = [];

export const SEED_BOOKINGS: Booking[] = [];


