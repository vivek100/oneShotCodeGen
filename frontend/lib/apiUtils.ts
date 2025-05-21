import { supabase } from './supabaseClient';

export async function getAuthHeaders() {
  console.log("apiUtils.ts called from api.ts")
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  console.log("apiUtils.ts called from api.ts", process.env.NEXT_PUBLIC_CLOUD_MODE)
  if (process.env.NEXT_PUBLIC_CLOUD_MODE === 'true') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  return headers;
}
