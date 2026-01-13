import type { IncomeApi, Income } from '../types/income.types';

const normalizeString = (v?: string | null) => v ?? '';
const normalizeNumber = (v?: number | string | null) => Number(v ?? 0);
const normalizeDate = (v?: string | null) => (v ?? '').slice(0, 10);

const normalizeUser = (user: IncomeApi['user']) => ({
  id: String(user?.id ?? ''),
  name: normalizeString(user?.name),
    email: normalizeString(user?.email),
  });

  export function normalizeIncome(t: IncomeApi): Income {
    return {
      id: String(t.id ?? ''),
      concept: normalizeString(t.concept),
      amount: normalizeNumber(t.amount),
      date: normalizeDate(t.date),
      user: normalizeUser(t.user),
  };
}
