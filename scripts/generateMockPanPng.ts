import fs from "fs";
import path from "path";
import zlib from "zlib";
import { renderTextToBmp } from "./createMockPanImage";

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      let bit = (byte ^ crc) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte >>>= 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

/**
 * Creates a valid PNG file from text lines using renderTextToBmp font layout.
 */
export function createPngFromText(lines: string[], outputPath: string, scale = 4): string {
  // We can render lines to BMP pixel array, then encode as PNG
  const bmpBuffer = renderTextToBmp(lines, scale);
  const width = bmpBuffer.readInt32LE(18);
  const height = bmpBuffer.readInt32LE(22);
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;

  // Build raw PNG scanlines (Filter byte 0 + RGB pixels)
  const rawScanlines: number[] = [];
  for (let y = height - 1; y >= 0; y--) { // BMP is bottom-up, PNG is top-down
    rawScanlines.push(0); // None filter
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + x * 3;
      const b = bmpBuffer[pxOffset];
      const g = bmpBuffer[pxOffset + 1];
      const r = bmpBuffer[pxOffset + 2];
      rawScanlines.push(r, g, b);
    }
  }

  const compressedData = zlib.deflateSync(Buffer.from(rawScanlines));

  // Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 2; // Color type RGB
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk("IHDR", ihdr);

  // IDAT
  const idatChunk = makeChunk("IDAT", compressedData);

  // IEND
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  const pngBuf = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, pngBuf);
  console.log(`Generated mock PNG image at ${outputPath} (${pngBuf.length} bytes, ${width}x${height})`);
  return outputPath;
}

if (require.main === module) {
  const lines = [
    "INCOME TAX DEPARTMENT GOVT OF INDIA",
    "NAME: APEX STEEL WORKS PVT LTD",
    "PAN: ABCDE1234F",
  ];
  const outPath = path.join(process.cwd(), "mock_pan_card_apex_steel_works.png");
  createPngFromText(lines, outPath, 4);
}
