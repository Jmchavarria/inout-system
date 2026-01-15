export type IncomeApi = {
  id: string | number;
  concept?: string | null;
  amount?: number | string | null;
  date?: string | null;
  user?: {
    id?: string | number | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

export type Income = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type IncomeListResponse = { items: IncomeApi[] };
export type CreateIncomeResponse = IncomeApi;
