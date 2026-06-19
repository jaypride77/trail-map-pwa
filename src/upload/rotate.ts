/**
 * Rotate an image data-URL by the given degrees and return a new data-URL.
 * The output canvas is expanded to fit the rotated image so no corners are clipped.
 */
export function rotateImageDataUrl(dataUrl: string, degrees: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rad = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));

      // Bounding box of the rotated image
      const newWidth = Math.round(img.width * cos + img.height * sin);
      const newHeight = Math.round(img.width * sin + img.height * cos);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;

      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
