import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';
import type { Store, StoreTier } from '@/lib/stores';
import { STORE_TIERS } from '@/lib/stores';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<ApiResponse<Store[]>>> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('code, name, aliases, tier, address, contact_name, contact_phone')
      .order('name');

    if (error) throw error;

    const stores: Store[] = (data ?? []).map(row => ({
      code: row.code,
      name: row.name,
      aliases: row.aliases ?? [],
      tier: row.tier as StoreTier,
      address: row.address ?? null,
      contact_name: row.contact_name ?? null,
      contact_phone: row.contact_phone ?? null,
    }));

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stores' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<Store>>> {
  try {
    // Auth check
    const { cookies } = await import('next/headers');
    const { verifySessionCookie } = await import('@/lib/auth');
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('kk-auth');
    if (!authCookie?.value) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const session = await verifySessionCookie(authCookie.value);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, tier, aliases, address, contact_name, contact_phone, password } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: 'Store code is required' }, { status: 400 });
    }

    // Store owners can only update their own store, limited fields
    if (session.role === 'store_owner') {
      if (code !== session.storeCode) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      const allowedFields = ['contact_name', 'contact_phone', 'address'];
      const updates: Record<string, unknown> = {};
      if (contact_name !== undefined) updates.contact_name = contact_name;
      if (contact_phone !== undefined) updates.contact_phone = contact_phone;
      if (address !== undefined) updates.address = address;

      // Check for disallowed fields
      const disallowed = Object.keys(body).filter(k => k !== 'code' && !allowedFields.includes(k));
      if (disallowed.length > 0) {
        return NextResponse.json({ success: false, error: `Store owners cannot update: ${disallowed.join(', ')}` }, { status: 403 });
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('code', code)
        .select('code, name, aliases, tier, address, contact_name, contact_phone')
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: {
          code: data.code,
          name: data.name,
          aliases: data.aliases ?? [],
          tier: data.tier as StoreTier,
          address: data.address ?? null,
          contact_name: data.contact_name ?? null,
          contact_phone: data.contact_phone ?? null,
        },
      });
    }

    // Only admins can proceed beyond this point
    if (session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (tier && !(tier in STORE_TIERS)) {
      return NextResponse.json({ success: false, error: 'Invalid tier value' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (tier !== undefined) updates.tier = tier;
    if (aliases !== undefined) updates.aliases = aliases;
    if (address !== undefined) updates.address = address;
    if (contact_name !== undefined) updates.contact_name = contact_name;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone;

    // Hash and store password if provided (admin setting store owner password)
    if (password !== undefined && password !== '') {
      const { hashPassword } = await import('@/lib/auth');
      updates.password_hash = await hashPassword(password);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('code', code)
      .select('code, name, aliases, tier, address, contact_name, contact_phone')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        code: data.code,
        name: data.name,
        aliases: data.aliases ?? [],
        tier: data.tier as StoreTier,
        address: data.address ?? null,
        contact_name: data.contact_name ?? null,
        contact_phone: data.contact_phone ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update store' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: 'Store code is required' }, { status: 400 });
    }

    // Get the store's id first
    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('id')
      .eq('code', code)
      .single();

    if (fetchError) throw fetchError;

    // Nullify store_id on related invoices so data isn't lost
    if (store) {
      await supabase
        .from('invoices')
        .update({ store_id: null })
        .eq('store_id', store.id);
    }

    // Delete the store
    const { error: deleteError } = await supabase
      .from('stores')
      .delete()
      .eq('code', code);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete store' },
      { status: 500 },
    );
  }
}
