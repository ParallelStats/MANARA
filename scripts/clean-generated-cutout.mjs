import { readFile } from "node:fs/promises";

import sharp from "sharp";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/clean-generated-cutout.mjs <input> <output>");
}

const source = await readFile(inputPath);
const { data, info } = await sharp(source)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height } = info;
const pixelCount = width * height;
const background = new Uint8Array(pixelCount);
const queued = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let head = 0;
let tail = 0;

function isBackdrop(index) {
  const offset = index * 3;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const lightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  return lightest >= 224 && lightest - darkest <= 18;
}

function enqueue(index) {
  if (queued[index] || !isBackdrop(index)) return;
  queued[index] = 1;
  queue[tail] = index;
  tail += 1;
}

for (let x = 0; x < width; x += 1) {
  enqueue(x);
}

for (let y = 0; y < height; y += 1) {
  enqueue(y * width);
  enqueue(y * width + width - 1);
}

while (head < tail) {
  const index = queue[head];
  head += 1;
  background[index] = 1;
  const x = index % width;
  const y = Math.floor(index / width);

  if (x > 0) enqueue(index - 1);
  if (x + 1 < width) enqueue(index + 1);
  if (y > 0) enqueue(index - width);
  if (y + 1 < height) enqueue(index + width);
}

const rgba = Buffer.allocUnsafe(pixelCount * 4);
for (let index = 0; index < pixelCount; index += 1) {
  const sourceOffset = index * 3;
  const outputOffset = index * 4;
  rgba[outputOffset] = data[sourceOffset];
  rgba[outputOffset + 1] = data[sourceOffset + 1];
  rgba[outputOffset + 2] = data[sourceOffset + 2];
  rgba[outputOffset + 3] = background[index] ? 0 : 255;
}

await sharp(rgba, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outputPath);
