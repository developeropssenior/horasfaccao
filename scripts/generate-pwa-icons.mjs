import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicIcons = join(__dirname, "..", "public", "icons");
const svgPath = join(publicIcons, "icon.svg");

const svg = readFileSync(svgPath);

for (const size of [192, 512]) {
  const png = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(publicIcons, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png`);
}
