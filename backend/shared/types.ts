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

export interface Transaction {
  id: string;
  outletId: string;
  cashierId: string;
  memberId?: string;
  totalAmount: number;
  paymentMethod: 'CASH' | 'QRIS';
  createdAt: Date;
  updatedAt: Date;
  isSynced?: boolean;
}
