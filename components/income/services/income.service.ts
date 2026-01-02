import type {
  IncomeListResponse,
  CreateIncomeResponse,
} from '../types/income.types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.error || data?.message || message;
    } catch { }
    throw new Error(message);
  }
  return res.json();
}

export const incomeService = {
  list() {
    return fetchJSON<IncomeListResponse>('/api/income', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  create(payload: { concept: string; amount: number; date: string }) {
    return fetchJSON<CreateIncomeResponse>('/api/income/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  },


};


export const userService = {
  list() {
    return fetchJSON('/api/users', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  edit(payload: { name: string, role: string }) {
    return fetchJSON('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
  }
}

