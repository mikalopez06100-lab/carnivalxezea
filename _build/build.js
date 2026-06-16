const sharp = require('sharp');
const path = require('path');

const SRC = 'C:/Users/ppmpc/Desktop/MasterPrompt/analyse/ezea/';
const OUT = 'C:/Users/ppmpc/ezea/assets/';

// ── Keying: black-art-on-white  ->  solid-color art on transparent ──
// alpha derived from darkness (art = opaque), rgb forced to target color.
async function keyLogo(srcFile, outFile, color, maxW) {
  const img = sharp(SRC + srcFile).rotate().resize({ width: maxW, withoutEnlargement: true });
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const existing = data[i + 3];          // honor source transparency (PNGs)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let a = Math.min(255, (255 - lum) * 1.35); // dark -> opaque, boosted
    a = Math.min(a, existing);             // never reveal transparent bg
    if (a < 18) a = 0;                     // clean white background noise
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2];
    data[i + 3] = a;
  }
  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 }).toFile(OUT + outFile);
  console.log('logo  ', outFile, width + 'x' + height);
}

// ── Sculpture: knock out the white studio background ──
// Pass 1: border flood removes pure white (>=248). Enclosed bottle whites stay.
// Pass 2: bottom-band flood removes the soft grey contact shadow (mid-grey
//   188-247, neutral) WITHOUT climbing into the bottle's whites (>=248).
// clearLeft: optional far-left bottom cleanup for stray reflection islands.
async function knockout(srcFile, outFile, clearLeft) {
  const { data, info } = await sharp(SRC + srcFile).rotate()
    .resize({ height: 1200, withoutEnlargement: true })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const at = (p) => p * channels;
  const white = (i) => data[i] >= 248 && data[i + 1] >= 248 && data[i + 2] >= 248;
  const grey = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mn >= 188 && mn <= 247 && (mx - mn) <= 20;
  };
  function flood(seedTest, passTest) {
    const vis = new Uint8Array(width * height), st = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const p = y * width + x;
      if (vis[p] || !passTest(p)) return;
      vis[p] = 1; st.push(p);
    };
    for (let x = 0; x < width; x++) { if (seedTest(x, 0)) push(x, 0); if (seedTest(x, height - 1)) push(x, height - 1); }
    for (let y = 0; y < height; y++) { if (seedTest(0, y)) push(0, y); if (seedTest(width - 1, y)) push(width - 1, y); }
    while (st.length) {
      const p = st.pop(); const x = p % width, y = (p / width) | 0;
      data[at(p) + 3] = 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
  }
  // pass 1 — pure white background
  flood(() => true, (p) => white(at(p)));
  // pass 2 — grey contact shadow, bottom band only
  const band = Math.floor(height * 0.74);
  flood((x, y) => y >= band, (p) => {
    if ((p / width | 0) < band) return false;
    return data[at(p) + 3] === 0 || grey(at(p));
  });
  // optional: clear stray light islands far bottom-left
  if (clearLeft) {
    const xMax = width * 0.27, yMin = height * 0.70;
    for (let y = Math.floor(yMin); y < height; y++)
      for (let x = 0; x < xMax; x++) {
        const i = at(y * width + x);
        if (data[i + 3] && (grey(i) || white(i))) data[i + 3] = 0;
      }
  }
  await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 }).trim().toFile(OUT + outFile);
  console.log('sculpt', outFile, width + 'x' + height);
}

async function photoCrop(srcFile, outFile, region, maxW) {
  await sharp(SRC + srcFile).rotate().extract(region)
    .resize({ width: maxW, withoutEnlargement: true })
    .jpeg({ quality: 82 }).toFile(OUT + outFile);
  console.log('photo ', outFile);
}
async function photo(srcFile, outFile, maxW) {
  await sharp(SRC + srcFile).rotate()
    .resize({ width: maxW, withoutEnlargement: true })
    .jpeg({ quality: 82 }).toFile(OUT + outFile);
  console.log('photo ', outFile);
}

(async () => {
  const WHITE = [255, 255, 255];
  const RED = [226, 0, 38];

  // Logos -> white, transparent
  await keyLogo('logo-carni-horiz2-2023.png', 'logo-carnival.png', WHITE, 700);
  await keyLogo('LOGO EZEA.jpg', 'logo-ezea.png', WHITE, 600);
  await keyLogo('SUN JUICE.jpg', 'logo-sunjuice.png', WHITE, 800);
  await keyLogo('signature test 6X1,5.jpg', 'logo-collab.png', WHITE, 700);
  await keyLogo('JOEY BY.jpg', 'signature-joey.png', WHITE, 600);
  // Stamp -> red ink, transparent
  await keyLogo('JOEY BY.jpg', 'stamp-joey.png', RED, 600);

  // Sculptures (unique cutouts)
  await knockout('4FEB2F54-80DE-4239-A33D-803447829B92 (1).PNG', 'drip-cyan.png');
  await knockout('B183B90B-3294-4478-9CEC-5062BE3D1FF2 (1).PNG', 'drip-jaune.png');
  await knockout('6165767D-65C5-4212-97E5-F655E8FF1197.PNG', 'splash-cyan.png');
  await knockout('590131C3-DAB9-4530-AFF8-1E034422F72C.PNG', 'splash-vert.png');
  await knockout('9E96D59B-9CC4-46EF-A00D-3D73A65F6687.PNG', 'splash-jaune.png');
  await knockout('D872D050-9246-4CEE-B5F6-9EABC05016E8.PNG', 'splash-rose.png');
  await knockout('7FE0A6F2-65A6-42B4-82FC-1A151DC18DDF.PNG', 'brush-cyan.png');
  await knockout('EB7FD8E2-B92F-4D5F-9BF0-FF2C706EB7D9.PNG', 'spin-rose.png', true);

  // Photos
  // photo-joey: left portion of etiquette (B&W JoeyStarr + bottles, no text)
  await photoCrop('etiquette.jpg', 'photo-joey.jpg', { left: 0, top: 0, width: 338, height: 445 }, 800);
  // atelier: sculptures on wood plank (auto-rotated via EXIF)
  await photo('IMG_2784.jpg', 'photo-atelier.jpg', 1600);

  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
