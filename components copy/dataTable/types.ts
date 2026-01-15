// components/dataTable/types.ts
export type ModalType = 'income' | 'user' | null;

export type ColumnConfig = {
  key: string;
  label: string;
  sortable?: boolean;
};

export type ModalController = {
  isOpen: boolean;
  type: ModalType;
  selected: any | null;
  open: (type: ModalType, selected?: any | null) => void;
  close: () => void;
};
