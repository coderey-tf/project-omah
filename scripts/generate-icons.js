const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

function createPng(width, height, pixelFn) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per row
  const rowStride = width * 4;
  const rawData = Buffer.alloc(height * (rowStride + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowStride + 1);
    rawData.writeUInt8(0, rowOffset); // filter 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData.writeUInt8(r, pxOffset);
      rawData.writeUInt8(g, pxOffset + 1);
      rawData.writeUInt8(b, pxOffset + 2);
      rawData.writeUInt8(a, pxOffset + 3);
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Omah Starbucks icon:
// Background: #1E3932 (House Green: 30, 57, 50)
// Concentric decorative ring: #006241 (Starbucks Green: 0, 98, 65) & #CBA258 (Warm Gold: 203, 162, 88)
// Icon: Roof (Omah/House) with a cozy coffee cup in the center
function omahIconRenderer(isMaskable) {
  return function(x, y, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const nx = (x - cx) / (w / 2); // -1 to 1
    const ny = (y - cy) / (h / 2); // -1 to 1
    const dist = Math.sqrt(nx * nx + ny * ny);

    // House Green: 30, 57, 50
    const bgR = 30, bgG = 57, bgB = 50;
    // Starbucks Green: 0, 98, 65
    const accR = 0, accG = 98, accB = 65;
    // Warm Gold: 203, 162, 88
    const goldR = 203, goldG = 162, goldB = 88;
    // Warm Cream: 242, 240, 235
    const creamR = 242, creamG = 240, creamB = 235;

    // Corner radius for standard icon vs maskable (full fill)
    if (!isMaskable) {
      // Rounded squircle (smooth squircle |x|^4 + |y|^4 < 1)
      const squircleDist = Math.pow(Math.abs(nx), 3.5) + Math.pow(Math.abs(ny), 3.5);
      if (squircleDist > 0.95) {
        return [0, 0, 0, 0]; // transparent outside squircle
      }
    }

    // Default base color: House Green
    let r = bgR, g = bgG, b = bgB, a = 255;

    // Circular inner badge
    if (dist < 0.88 && dist > 0.82) {
      // Gold thin ring
      return [goldR, goldG, goldB, 255];
    }
    if (dist < 0.82 && dist > 0.77) {
      // Starbucks green ring
      return [accR, accG, accB, 255];
    }

    // HOUSE ROOF (Triangle at top)
    // Roof apex: (nx = 0, ny = -0.48), eaves: left (nx = -0.45, ny = -0.05), right (nx = 0.45, ny = -0.05)
    const roofApexY = -0.48;
    const roofBaseY = -0.06;
    const roofSlope = 0.45 / (roofBaseY - roofApexY); // slope dx/dy

    if (ny >= roofApexY && ny <= roofBaseY) {
      const maxWidthAtY = (ny - roofApexY) * roofSlope;
      if (Math.abs(nx) <= maxWidthAtY) {
        // Inside roof outer triangle
        const innerApexY = roofApexY + 0.08;
        const innerSlope = 0.35 / (roofBaseY - innerApexY);
        const innerWidth = (ny - innerApexY) * innerSlope;
        if (ny >= innerApexY && Math.abs(nx) <= innerWidth) {
          // Inside roof hollow -> deep house green
          r = bgR; g = bgG; b = bgB;
        } else {
          // Roof beam -> Warm Gold
          return [goldR, goldG, goldB, 255];
        }
      }
    }

    // HOUSE BODY / WALLS
    // nx: [-0.35, 0.35], ny: [-0.06, 0.45]
    if (ny >= -0.06 && ny <= 0.46 && Math.abs(nx) <= 0.36) {
      // Wall border
      if (Math.abs(nx) >= 0.31 || ny >= 0.41) {
        return [goldR, goldG, goldB, 255];
      }

      // COFFEE CUP IN CENTER (DOORWAY)
      // Cup body: nx: [-0.18, 0.18], ny: [0.05, 0.35]
      const cupTop = 0.06;
      const cupBottom = 0.34;
      if (ny >= cupTop && ny <= cupBottom) {
        // Tapered cup body
        const cupWidth = 0.17 - (ny - cupTop) * 0.1;
        if (Math.abs(nx) <= cupWidth) {
          // Warm Cream cup
          return [creamR, creamG, creamB, 255];
        }
      }

      // Cup handle: right side nx: [0.15, 0.25], ny: [0.12, 0.28]
      const handleDist = Math.sqrt(Math.pow(nx - 0.18, 2) + Math.pow(ny - 0.20, 2));
      if (handleDist <= 0.08 && handleDist >= 0.04 && nx > 0.14) {
        return [creamR, creamG, creamB, 255];
      }

      // Coffee steam / aroma swirls above cup
      // Left steam: (-0.08, -0.02), Right steam: (0.08, -0.02)
      if (ny >= -0.04 && ny <= 0.04) {
        const steam1 = Math.abs(nx - 0.06 * Math.sin(ny * 40));
        if (steam1 < 0.022) {
          return [goldR, goldG, goldB, 255];
        }
      }
    }

    return [r, g, b, a];
  };
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');

// 1. icon-192.png
const png192 = createPng(192, 192, omahIconRenderer(false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
console.log('Created icon-192.png (' + png192.length + ' bytes)');

// 2. icon-512.png
const png512 = createPng(512, 512, omahIconRenderer(false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
console.log('Created icon-512.png (' + png512.length + ' bytes)');

// 3. icon-maskable-512.png (full bleed for Android adaptive icons)
const pngMaskable = createPng(512, 512, omahIconRenderer(true));
fs.writeFileSync(path.join(iconsDir, 'icon-maskable-512.png'), pngMaskable);
console.log('Created icon-maskable-512.png (' + pngMaskable.length + ' bytes)');

// 4. Also generate SVG version
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#1E3932"/>
  <circle cx="256" cy="256" r="218" fill="none" stroke="#CBA258" stroke-width="6"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="#006241" stroke-width="12"/>
  <!-- Roof -->
  <polygon points="256,120 130,240 152,256 256,155 360,256 382,240" fill="#CBA258"/>
  <!-- House Walls -->
  <rect x="170" y="246" width="172" height="130" rx="8" fill="#1E3932" stroke="#CBA258" stroke-width="14"/>
  <!-- Coffee Cup -->
  <path d="M 210 275 L 302 275 C 302 335 292 345 256 345 C 220 345 210 335 210 275 Z" fill="#F2F0EB"/>
  <!-- Cup Handle -->
  <path d="M 296 288 C 322 288 322 322 296 322" fill="none" stroke="#F2F0EB" stroke-width="10" stroke-linecap="round"/>
  <!-- Steam Waves -->
  <path d="M 242 262 Q 248 248 242 238" fill="none" stroke="#CBA258" stroke-width="6" stroke-linecap="round"/>
  <path d="M 256 264 Q 262 250 256 240" fill="none" stroke="#CBA258" stroke-width="6" stroke-linecap="round"/>
  <path d="M 270 262 Q 276 248 270 238" fill="none" stroke="#CBA258" stroke-width="6" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);
console.log('Created icon.svg');

console.log('Done generating all icons!');
