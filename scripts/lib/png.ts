/**
 * Décodeur PNG minimal (8 bits, RGB/RGBA, non entrelacé), comme celui de l'audit des aperçus : sert à
 * refuser une capture uniforme (zone non peinte, contenu encore invisible).
 */
import zlib from 'node:zlib';

export interface Png {
  width: number;
  height: number;
  channels: number;
  data: Buffer;
}

export function decodePng(buffer: Buffer): Png | null {
  let pos = 8,
    width = 0,
    height = 0,
    channels = 4;
  const idat: Buffer[] = [];
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos),
      type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0;
      if (data[8] !== 8 || !channels || data[12]) return null;
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels,
    out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)],
      row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0,
        b = y ? out[(y - 1) * stride + x] : 0,
        c = x >= channels && y ? out[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c,
        pa = Math.abs(p - a),
        pb = Math.abs(p - b),
        pc = Math.abs(p - c);
      const pred = f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0;
      out[y * stride + x] = (row[x] + pred) & 255;
    }
  }
  return { width, height, channels, data: out };
}

/** Part des pixels qui se distinguent du fond (couleur du coin haut-gauche), entre 0 et 1. */
export function distinctRatio(png: Png): number {
  const { data, channels, width, height } = png;
  const [r0, g0, b0] = [data[0], data[1], data[2]];
  let n = 0;
  for (let i = 0; i < width * height; i++) {
    const k = i * channels;
    if (Math.max(Math.abs(data[k] - r0), Math.abs(data[k + 1] - g0), Math.abs(data[k + 2] - b0)) > 12) n++;
  }
  return n / Math.max(1, width * height);
}
