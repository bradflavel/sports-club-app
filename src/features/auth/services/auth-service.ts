import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/supabase/database.types';

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) return { data: null, error };

  // Update the profile record created by the trigger
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
      })
      .eq('id', data.user.id);

    if (profileError) return { data: null, error: profileError };
  }

  return { data, error: null };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  return { data, error };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  return { data: null, error };
}

export async function getSession() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getSession();

  return { data, error };
}

export async function updateProfile(
  userId: string,
  profileData: Partial<
    Pick<
      Profile,
      | 'first_name'
      | 'last_name'
      | 'phone'
      | 'date_of_birth'
      | 'avatar_url'
      | 'emergency_contact_name'
      | 'emergency_contact_phone'
      | 'organisation_id'
      | 'role'
    >
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profileData, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}
