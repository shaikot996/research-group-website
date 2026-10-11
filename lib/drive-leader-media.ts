/** Guard against public Google Drive interstitial/login HTML being saved as a picture or CV. */
export function imageExtensionFromBytes(bytes: Buffer): ".jpg" | ".png" | ".webp" {
  if (bytes.length < 12) throw new Error("Image download is too small or empty.");
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ".png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return ".webp";
  throw new Error("Drive picture download was not JPEG, PNG or WebP; refusing to replace the existing photo.");
}

export function validatePdf(bytes: Buffer): void {
  if (bytes.length < 8 || bytes.toString("ascii", 0, 5) !== "%PDF-") {
    throw new Error("Drive CV download is not a PDF; refusing to replace the existing CV.");
  }
}

/** Prefer a person's canonical profile.* or cv.pdf files, independent of Google Drive listing order. */
export function portraitRank(filename: string): number {
  if (/^profile\.(jpe?g|png|webp)$/i.test(filename)) return 100;
  if (/^(?:portrait|headshot|photo)\.(jpe?g|png|webp)$/i.test(filename)) return 80;
  return 10;
}
export function cvRank(filename: string): number {
  if (/^cv\.pdf$/i.test(filename)) return 100;
  if (/^(?:resume|curriculum[-_ ]?vitae)\.pdf$/i.test(filename)) return 80;
  return 10;
}
