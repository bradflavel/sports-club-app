'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { OrderManagementTable } from '@/features/shop/components/admin/order-management-table';
import { OrderQrScanner } from '@/features/shop/components/admin/order-qr-scanner';
import { getOrgOrders } from '@/features/shop/services/order-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ShopOrder, ShopOrderStatus } from '@/lib/supabase/database.types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'ready_for_pickup', label: 'Ready' },
  { value: 'collected', label: 'Collected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scannerOpen, setScannerOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchOrders = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);
    const { data, error } = await getOrgOrders(organisation.id, {
      search: search || undefined,
      status: statusFilter !== 'all' ? [statusFilter] : undefined,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setOrders(data);
    }
    setLoading(false);
  }, [organisation?.id, search, statusFilter, toast]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchOrders();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchOrders]);

  if (orgLoading || userLoading) return <PageSkeleton />;
  if (!isAdmin) return <p className="py-12 text-center text-muted-foreground">Access denied</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/admin">
          <ArrowLeft className="h-4 w-4" />
          Back to Shop Admin
        </Link>
      </Button>

      <PageHeader
        title="Orders"
        description="Manage member orders"
        actions={
          <Button size="sm" onClick={() => setScannerOpen(true)} className="gap-2">
            <QrCode className="h-4 w-4" />
            Scan QR
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search by order number..."
          onSearch={setSearch}
          className="w-full sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <OrderManagementTable
          orders={orders}
          onRefresh={fetchOrders}
          onOpenScanner={() => setScannerOpen(true)}
        />
      )}

      <OrderQrScanner
        orgId={organisation!.id}
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onVerified={fetchOrders}
      />
    </div>
  );
}
