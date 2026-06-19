import * as pdfjsLib from 'pdfjs-dist';

// Point pdf.js at its own worker bundle (co-located by Vite).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

/**
 * Load a PDF, PNG, or JPG file and return a data-URL of the first page
 * rendered at the given device pixel ratio.
 */
export async function loadMapImage(file: File, scale = 2): Promise<string> {
  if (file.type === 'application/pdf') {
    return renderPdfPage(file, scale);
  }
  return readImageFile(file);
}

async function renderPdfPage(file: File, scale: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
