import { createClient } from '@supabase/supabase-js';

const MEDIA_BUCKET = process.env.SITE_MEDIA_BUCKET || 'site-media';

export class StorageConfigurationError extends Error {}

export function getMediaStorage() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new StorageConfigurationError('Configuração do Supabase Storage ausente.');
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    bucket: MEDIA_BUCKET,
    client,
  };
}
