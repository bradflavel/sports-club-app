import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { signUp, signIn, signOut } from '@/features/auth/services/auth-service';

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();

const mockSupabase = {
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
  },
  from: mockFrom,
};

beforeEach(() => {
  vi.clearAllMocks();
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

  // Default chain: from().update().eq() (used inside signUp profile update)
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockEq.mockReturnValue({ select: mockSelect, single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ update: mockUpdate, select: mockSelect });
});

describe('signUp', () => {
  it('calls supabase.auth.signUp with correct params', async () => {
    const mockUser = { id: 'user-123' };
    mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });

    await signUp('jane@example.com', 'password123', 'Jane', 'Doe');

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'password123',
      options: {
        data: {
          first_name: 'Jane',
          last_name: 'Doe',
        },
      },
    });
  });

  it('returns error when auth.signUp fails', async () => {
    const authError = new Error('Email already exists');
    mockSignUp.mockResolvedValue({ data: null, error: authError });

    const result = await signUp('jane@example.com', 'password123', 'Jane', 'Doe');

    expect(result.error).toBe(authError);
    expect(result.data).toBeNull();
  });

  it('updates profile record after successful sign-up', async () => {
    const mockUser = { id: 'user-123' };
    mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });

    await signUp('jane@example.com', 'password123', 'Jane', 'Doe');

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      })
    );
  });

  it('returns profile error when profile update fails', async () => {
    const mockUser = { id: 'user-123' };
    mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });
    const profileError = new Error('Profile update failed');
    mockEq.mockReturnValue({ error: profileError });
    // Override mockUpdate to return the error directly via eq
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: profileError }),
    });
    // Re-wire from
    mockFrom.mockReturnValue({ update: mockUpdate });

    const result = await signUp('jane@example.com', 'password123', 'Jane', 'Doe');

    expect(result.data).toBeNull();
    expect(result.error).toBe(profileError);
  });

  it('returns data when sign-up succeeds with no user (email confirmation required)', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null });

    const result = await signUp('jane@example.com', 'password123', 'Jane', 'Doe');

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

describe('signIn', () => {
  it('calls supabase.auth.signInWithPassword with correct params', async () => {
    const mockSession = { user: { id: 'user-123' } };
    mockSignInWithPassword.mockResolvedValue({ data: mockSession, error: null });

    const result = await signIn('jane@example.com', 'password123');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(result.data).toBe(mockSession);
    expect(result.error).toBeNull();
  });

  it('returns error when credentials are invalid', async () => {
    const authError = new Error('Invalid credentials');
    mockSignInWithPassword.mockResolvedValue({ data: null, error: authError });

    const result = await signIn('jane@example.com', 'wrongpassword');

    expect(result.data).toBeNull();
    expect(result.error).toBe(authError);
  });

  it('passes through both data and error from supabase', async () => {
    const sessionData = { user: { id: 'abc' }, session: { access_token: 'token' } };
    mockSignInWithPassword.mockResolvedValue({ data: sessionData, error: null });

    const result = await signIn('a@b.com', 'pass');

    expect(result.data).toEqual(sessionData);
    expect(result.error).toBeNull();
  });
});

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(mockSignOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(result.data).toBeNull();
  });

  it('returns error when sign-out fails', async () => {
    const signOutError = new Error('Sign out failed');
    mockSignOut.mockResolvedValue({ error: signOutError });

    const result = await signOut();

    expect(result.error).toBe(signOutError);
  });

  it('always returns null for data', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(result.data).toBeNull();
  });
});
