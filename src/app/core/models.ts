export type ClientType = 'patisserie' | 'institut' | 'restaurant' | 'autre';

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  email?: string;
  phone?: string;
  defaultFee?: number;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface PaymentTarget {
  id: string;
  clientId: string;
  title: string;
  totalAmount: number;
  createdAt: string;
  dueDate?: string;
  status: PaymentStatus;
}

export interface PaymentPart {
  id: string;
  paymentTargetId: string;
  amount: number;
  date: string;
  note?: string;
  splitLive: number;
  splitBusiness: number;
  splitSave: number;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  type: 'personal' | 'business';
}

export interface Feedback {
  id: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'collaborator';
  createdAt: string;
}

export interface Ratios {
  live: number; // 0.4
  business: number; // 0.4
  save: number; // 0.2
}

export interface AppSettings {
  id: 'default';
  currency: string;
  ratios: Ratios;
  expenseCategories: string[];
}

export interface OtherIncome {
  id: string;
  amount: number;
  date: string;
  source: string; // Source du revenu (ex: "Vente photo", "Prestation freelance", etc.)
  note?: string;
  splitLive: number;
  splitBusiness: number;
  splitSave: number;
  createdAt: string;
}


