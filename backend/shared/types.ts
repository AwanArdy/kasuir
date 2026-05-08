/**
 * Shared interfaces for FE-BE alignment and Sync logic.
 * These match the FE camelCase requirements.
 */

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  outletId: string;
}

export interface Outlet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  updatedAt: Date;
}

export interface Product {
  id: string;
  outletId: string;
  categoryId: string;
  unitId: string;
  name: string;
  sellingPrice: number;
  hpp?: number;
  emoji?: string;
  updatedAt: Date;
}

export interface Member {
  id: string;
  outletId: string;
  name: string;
  email?: string;
  phone?: string;
  points?: number;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  address?: string;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  outletId: string;
  userId: string;
  category: string;
  amount: number;
  note?: string;
  date: Date;
  isSynced?: boolean;
}

export interface Transaction {
  id: string;
  outletId: string;
  cashierId: string;
  memberId?: string;
  orderType?: 'dine-in' | 'take-away' | 'delivery';
  tableNumber?: string;
  deliveryPlatform?: string;
  paymentMethod: 'CASH' | 'QRIS';
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  receivedAmount?: number;
  changeAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  isSynced?: boolean;
}
