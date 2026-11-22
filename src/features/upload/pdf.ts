import type { ScanPage } from "./scanner-types";

async function encodePage(page: ScanPage, highQuality: boolean) {
  const image = await createImageBitmap(page.file);
  try {
    const longEdge = highQuality ? 2600 : 2000;
    const scale = Math.min(1, longEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const rotated = page.turns % 2 !== 0;
    const canvas = document.createElement("canvas");
    canvas.width = rotated ? height : width;
    canvas.height = rotated ? width : height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser couldn’t prepare the scan.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(page.turns * Math.PI / 2);
    context.drawImage(image, -width / 2, -height / 2, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error("A page couldn’t be encoded.")),
        "image/jpeg", highQuality ? 0.9 : 0.8);
    });
    canvas.width = 1;
    canvas.height = 1;
    return blob;
  } finally { image.close(); }
}

export async function makePdf(pages: ScanPage[], highQuality: boolean, progress: (complete: number) => void) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const [index, page] of pages.entries()) {
    const compressed = await encodePage(page, highQuality);
    const image = await pdf.embedJpg(await compressed.arrayBuffer());
    const scale = 792 / Math.max(image.width, image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    pdf.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    progress(index + 1);
  }
  const pdfBytes = await pdf.save();
  return new File([new Uint8Array(pdfBytes)], "shelf-scan.pdf", { type: "application/pdf" });
}
