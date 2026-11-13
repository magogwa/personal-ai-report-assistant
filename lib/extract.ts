import fs from "fs";
import zlib from "zlib";

export function extractText(filePath: string, fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  const buf = fs.readFileSync(filePath);
  if (ext === "txt") return buf.toString("utf8");
  if (ext === "docx") {
    // Parse zip, find word/document.xml, inflate, strip tags
    try {
      const xml = readZipEntry(buf, "word/document.xml");
      if (!xml) return "";
      return xml.replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    } catch { return ""; }
  }
  if (ext === "pdf") {
    // Basic text extraction from PDF streams
    const str = buf.toString("latin1");
    const matches = str.match(/\(([^)]*)\)/g) || [];
    return matches.map((m) => m.slice(1, -1)).join(" ").replace(/\\n/g, "\n").trim();
  }
  return "";
}

function readZipEntry(buf: Buffer, target: string): string | null {
  // Find End of Central Directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const cdSize = buf.readUInt32LE(eocd + 12);
  let pos = cdOffset;
  while (pos < cdOffset + cdSize) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const compSize = buf.readUInt32LE(pos + 20);
    const method = buf.readUInt16LE(pos + 10);
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLen);
    if (name === target) {
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.slice(dataStart, dataStart + compSize);
      if (method === 0) return data.toString("utf8");
      if (method === 8) return zlib.inflateRawSync(data).toString("utf8");
      return null;
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}