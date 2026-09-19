import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export type ReceiptItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export type Receipt = {
  id: string;
  storeName: string;
  date: string;
  currency: string;
  totalAmount: number;
  items: ReceiptItem[];
}

interface AppState {
  receipts: Receipt[];
  comparisons: Record<string, any[]>;
  fetchReceipts: () => Promise<void>;
  fetchComparisons: () => Promise<void>;
  addReceipt: (storeName: string, date: string, totalAmount: number, currency: string, items: ReceiptItem[]) => Promise<void>;
  scanReceipt: (file: File) => Promise<{ storeName: string, date: string, totalAmount: number, currency?: string, items: ReceiptItem[] }>;
  deleteReceipt: (id: string) => Promise<void>;
  fetchExchangeRate: () => Promise<number>;
}

export const useStore = create<AppState>((set) => ({
  receipts: [],
  comparisons: {},
  fetchExchangeRate: async () => {
    const res = await api.get('/receipts/exchange-rate');
    return res.data.usdToKrw;
  },
  fetchReceipts: async () => {
    const res = await api.get('/receipts');
    set({ receipts: res.data });
  },
  fetchComparisons: async () => {
    const res = await api.get('/receipts/products/compare');
    set({ comparisons: res.data });
  },
  addReceipt: async (storeName, date, totalAmount, currency, items) => {
    const res = await api.post('/receipts', { storeName, date, totalAmount, currency, items });
    set((state) => ({ receipts: [res.data, ...state.receipts] }));
  },
  scanReceipt: async (file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await api.post('/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  deleteReceipt: async (id: string) => {
    await api.delete(`/receipts/${id}`);
    set((state) => ({ receipts: state.receipts.filter(r => r.id !== id) }));
  }
}));
