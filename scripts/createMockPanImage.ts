import fs from "fs";
import path from "path";

// Clean 5x7 bitmap font dictionary
const FONT_5X7: Record<string, number[]> = {
  'A': [0x0E, 0x11, 0x1F, 0x11, 0x11],
  'B': [0x1E, 0x11, 0x1E, 0x11, 0x1E],
  'C': [0x0E, 0x11, 0x10, 0x11, 0x0E],
  'D': [0x1C, 0x12, 0x11, 0x12, 0x1C],
  'E': [0x1F, 0x10, 0x1E, 0x10, 0x1F],
  'F': [0x1F, 0x10, 0x1E, 0x10, 0x10],
  'G': [0x0E, 0x11, 0x13, 0x11, 0x0F],
  'H': [0x11, 0x11, 0x1F, 0x11, 0x11],
  'I': [0x0E, 0x04, 0x04, 0x04, 0x0E],
  'J': [0x07, 0x02, 0x02, 0x12, 0x0C],
  'K': [0x11, 0x12, 0x1C, 0x12, 0x11],
  'L': [0x10, 0x10, 0x10, 0x10, 0x1F],
  'M': [0x11, 0x1B, 0x15, 0x11, 0x11],
  'N': [0x11, 0x19, 0x15, 0x13, 0x11],
  'O': [0x0E, 0x11, 0x11, 0x11, 0x0E],
  'P': [0x1E, 0x11, 0x1E, 0x10, 0x10],
  'Q': [0x0E, 0x11, 0x15, 0x12, 0x0D],
  'R': [0x1E, 0x11, 0x1E, 0x14, 0x11],
  'S': [0x0F, 0x10, 0x0E, 0x01, 0x1E],
  'T': [0x1F, 0x04, 0x04, 0x04, 0x04],
  'U': [0x11, 0x11, 0x11, 0x11, 0x0E],
  'V': [0x11, 0x11, 0x11, 0x0A, 0x04],
  'W': [0x11, 0x11, 0x15, 0x15, 0x0A],
  'X': [0x11, 0x0A, 0x04, 0x0A, 0x11],
  'Y': [0x11, 0x0A, 0x04, 0x04, 0x04],
  'Z': [0x1F, 0x02, 0x04, 0x08, 0x1F],
  '0': [0x0E, 0x11, 0x11, 0x11, 0x0E],
  '1': [0x04, 0x0C, 0x04, 0x04, 0x0E],
  '2': [0x0E, 0x01, 0x0E, 0x10, 0x1F],
  '3': [0x1F, 0x02, 0x0E, 0x01, 0x1E],
  '4': [0x02, 0x06, 0x0A, 0x1F, 0x02],
  '5': [0x1F, 0x10, 0x1E, 0x01, 0x1E],
  '6': [0x0E, 0x10, 0x1E, 0x11, 0x0E],
  '7': [0x1F, 0x01, 0x02, 0x04, 0x04],
  '8': [0x0E, 0x11, 0x0E, 0x11, 0x0E],
  '9': [0x0E, 0x11, 0x0F, 0x01, 0x0E],
  ':': [0x00, 0x0C, 0x00, 0x0C, 0x00],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '-': [0x00, 0x00, 0x1F, 0x00, 0x00],
  '/': [0x01, 0x02, 0x04, 0x08, 0x10],
};

/**
 * Renders lines of text into an uncompressed 24-bit BMP image buffer.
 */
export function renderTextToBmp(lines: string[], scale = 6): Buffer {
  const charWidth = 6;
  const charHeight = 7;
  const lineSpacing = 6;
  const lineHeight = (charHeight + lineSpacing) * scale;
  const padding = 30 * scale;

  let maxCols = 0;
  lines.forEach((line) => {
    let width = 0;
    for (const char of line.toUpperCase()) {
      const fontCols = FONT_5X7[char] || FONT_5X7[' '];
      width += fontCols.length + 1;
    }
    if (width > maxCols) maxCols = width;
  });

  const width = (maxCols * charWidth * scale) + (padding * 2);
  const height = (lines.length * lineHeight) + (padding * 2);

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = Buffer.alloc(fileSize);

  // BMP Header (14 bytes)
  buffer.write("BM", 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);

  // DIB Header (40 bytes)
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(pixelArraySize, 34);

  // Fill background with WHITE (255, 255, 255)
  for (let y = 0; y < height; y++) {
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + x * 3;
      buffer[pxOffset] = 255;
      buffer[pxOffset + 1] = 255;
      buffer[pxOffset + 2] = 255;
    }
  }

  // Draw black text pixels (0, 0, 0)
  lines.forEach((line, lineIdx) => {
    const startY = height - padding - (lineIdx + 1) * lineHeight;
    let startX = padding;

    for (const char of line.toUpperCase()) {
      const fontRows = FONT_5X7[char] || FONT_5X7[' '];
      for (let r = 0; r < fontRows.length; r++) {
        const rowByte = fontRows[r];
        for (let c = 0; c < 5; c++) {
          if ((rowByte & (1 << (4 - c))) !== 0) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const px = startX + c * scale + sx;
                const py = startY + (charHeight - r) * scale + sy;
                if (px >= 0 && px < width && py >= 0 && py < height) {
                  const rowOffset = 54 + py * rowSize;
                  const pxOffset = rowOffset + px * 3;
                  buffer[pxOffset] = 0;
                  buffer[pxOffset + 1] = 0;
                  buffer[pxOffset + 2] = 0;
                }
              }
            }
          }
        }
      }
      startX += (5 + 2) * scale;
    }
  });

  return buffer;
}
