import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/shop/downloads/[downloadId]
 *
 * Generates a signed download URL for a digital product.
 * Verifies ownership, checks download limits, increments counter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ downloadId: string }> }
) {
  try {
    const { downloadId } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch download record
    const { data: download, error } = await supabase
      .from('digital_downloads')
      .select('*, product:products(*)')
      .eq('id', downloadId)
      .eq('profile_id', user.id)
      .single();

    if (error || !download) {
      return NextResponse.json({ error: 'Download not found' }, { status: 404 });
    }

    const downloadCount = download.download_count as number;
    const maxDownloads = download.max_downloads as number;
    const expiresAt = download.expires_at as string | null;

    // Check limits
    if (downloadCount >= maxDownloads) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 403 });
    }

    // Check expiry
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Download has expired' }, { status: 403 });
    }

    // Get file path
    const product = download.product as Record<string, unknown>;
    const fileUrls = product?.digital_file_urls as string[] | null;

    if (!fileUrls || fileUrls.length === 0) {
      return NextResponse.json({ error: 'No files available' }, { status: 404 });
    }

    // Generate signed URL (5 minute expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('shop-digital')
      .createSignedUrl(fileUrls[0], 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    // Increment download count
    await supabase
      .from('digital_downloads')
      .update({ download_count: downloadCount + 1 })
      .eq('id', downloadId);

    // Redirect to signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
