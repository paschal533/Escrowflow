export async function uploadFile(file: File): Promise<string> {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url as string;
}
