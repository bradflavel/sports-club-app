export type {
  Payment,
  PaymentWithMember,
  PaymentType,
  PaymentStatus,
} from '@/lib/supabase/database.types';

export interface PaymentFormData {
  memberId: string;
  description: string;
  amount: number;
  paymentType: string;
  dueDate: string;
}

export interface PaymentFilters {
  search?: string;
  paymentType?: string[];
  status?: string[];
  memberId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface PaymentSummary {
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
}
