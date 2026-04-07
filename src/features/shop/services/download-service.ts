import { createClient } from '@/lib/supabase/client';
import type { DigitalDownload, DigitalDownloadWithProduct } from '@/lib/supabase/database.types';

const DOWNLOAD_WITH_DETAILS_SELECT = '*, product:products(*), order_item:order_items(*)';

export async function getMyDownloads(profileId: string, orgId: string) {
  const supabase = createClient();

  // Get downloads where product belongs to org
  const { data, error } = await supabase
    .from('digital_downloads')
    .select(DOWNLOAD_WITH_DETAILS_SELECT)
    .eq('profile_id', profileId);

  if (error) return { data: [], error };

  // Filter by org (product.organisation_id)
  const filtered = (data ?? []).filter(
    (d: Record<string, unknown>) =>
      (d.product as Record<string, unknown>)?.organisation_id === orgId
  );

  return { data: filtered as unknown as DigitalDownloadWithProduct[], error: null };
}

export async function getDownloadsForOrder(orderId: string, profileId: string) {
  const supabase = createClient();

  // Get order items for this order
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', orderId);

  if (!orderItems || orderItems.length === 0) {
    return { data: [], error: null };
  }

  const orderItemIds = orderItems.map((item) => item.id as string);

  const { data, error } = await supabase
    .from('digital_downloads')
    .select(DOWNLOAD_WITH_DETAILS_SELECT)
    .eq('profile_id', profileId)
    .in('order_item_id', orderItemIds);

  return { data: (data ?? []) as unknown as DigitalDownloadWithProduct[], error };
}

export async function generateDownloadUrl(
  downloadId: string,
  profileId: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  // Verify ownership and limits
  const { data: download, error } = await supabase
    .from('digital_downloads')
    .select('*, product:products(*)')
    .eq('id', downloadId)
    .eq('profile_id', profileId)
    .single();

  if (error || !download) {
    return { url: null, error: 'Download not found' };
  }

  const dl = download as unknown as DigitalDownloadWithProduct;

  // Check download limit
  if (dl.download_count >= dl.max_downloads) {
    return { url: null, error: 'Download limit reached' };
  }

  // Check expiry
  if (dl.expires_at && new Date(dl.expires_at) < new Date()) {
    return { url: null, error: 'Download has expired' };
  }

  // Get product files
  const fileUrls = dl.product.digital_file_urls;
  if (!fileUrls || fileUrls.length === 0) {
    return { url: null, error: 'No files available' };
  }

  // Generate signed URL for first file (5 minute expiry)
  const filePath = fileUrls[0];
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('shop-digital')
    .createSignedUrl(filePath, 300); // 5 minutes

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return { url: null, error: 'Failed to generate download link' };
  }

  // Increment download count
  await supabase
    .from('digital_downloads')
    .update({ download_count: dl.download_count + 1 })
    .eq('id', downloadId);

  return { url: signedUrlData.signedUrl, error: null };
}
