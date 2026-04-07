export type {
  ProductCategory,
  Product,
  ProductWithCategory,
  ProductVariant,
  ProductWithVariants,
  ProductAccessRule,
  CartItem,
  CartItemWithDetails,
  DiscountCode,
  ShopOrder,
  OrderItem,
  ShopOrderWithItems,
  DigitalDownload,
  DigitalDownloadWithProduct,
  ProductType,
  DiscountType,
  ShopOrderStatus,
} from '@/lib/supabase/database.types';

export interface ShopFilters {
  search?: string;
  categoryId?: string;
  productType?: string;
}

export interface OrderFilters {
  search?: string;
  status?: string[];
}

export interface DiscountCodeFilters {
  search?: string;
  isActive?: boolean;
}

export type StockDisplayLabel = 'in_stock' | 'low_stock' | 'sold_out' | 'preorder';

export interface DiscountValidationResult {
  valid: boolean;
  discountCents: number;
  message?: string;
  discountCode?: import('@/lib/supabase/database.types').DiscountCode;
}
