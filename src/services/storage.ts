import { supabase } from './supabase';

const BUCKET = 'trade-screenshots';

export async function uploadScreenshot(localUri: string, userId: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadScreenshots(localUris: string[], userId: string): Promise<string[]> {
  return Promise.all(localUris.map((uri) => uploadScreenshot(uri, userId)));
}
