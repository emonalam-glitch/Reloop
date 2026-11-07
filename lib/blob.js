import { put, del } from '@vercel/blob';

export async function uploadImage(file, filename) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is missing');
  }
  const blob = await put(filename, file, {
    access: 'public',
  });
  return blob.url;
}

export async function deleteImage(url) {
  if (!url || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(url);
  } catch (error) {
    console.error('Failed to delete blob image:', error);
  }
}
