export const MAX_SIDE = 768;
export const JPEG_QUALITY = 0.7;

function loadImageElement(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image.'));
    };
    img.src = url;
  });
}

export async function compressImageToJpeg(blob) {
  let source;
  try {
    source = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    source = await loadImageElement(blob);
  }

  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    if (typeof source.close === 'function') {
      source.close();
    }
  }
}