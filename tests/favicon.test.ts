import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(REPO_ROOT, "public");

interface IhdrInfo {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
}

function readIhdr(png: Buffer): IhdrInfo {
  // PNG: 8-byte signature, then chunks. IHDR is the first chunk:
  // 4-byte length, "IHDR", then 4-byte width, 4-byte height, 1-byte bit depth, 1-byte color type
  if (
    png.length < 24 ||
    png[0] !== 0x89 ||
    png[1] !== 0x50 ||
    png[2] !== 0x4e ||
    png[3] !== 0x47
  ) {
    throw new Error("not a PNG (bad signature)");
  }
  // IHDR starts at offset 8 (signature) + 8 (length + "IHDR")
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];
  return { width, height, bitDepth, colorType };
}

function expectPngSignature(png: Buffer): void {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) {
    expect(png[i]).toBe(sig[i]);
  }
}

function validateSvg(svg: string): void {
  // viewBox 0 0 320 320
  const viewBoxMatch = svg.match(/viewBox\s*=\s*"([^"]+)"/);
  expect(viewBoxMatch, "svg has viewBox").not.toBeNull();
  expect(viewBoxMatch![1].trim()).toBe("0 0 320 320");

  // Palette: green #c8ff36, dark #121310, glyph #0c0d0a
  expect(svg).toContain("#c8ff36");
  expect(svg).toContain("#121310");
  expect(svg).toContain("#0c0d0a");

  // Code "TFL" must be present as readable text in the markup
  expect(svg).toMatch(/>TFL</);

  // Token rectangles: at least three <rect> elements (one per token)
  const rectCount = (svg.match(/<rect\b/g) ?? []).length;
  expect(rectCount).toBeGreaterThanOrEqual(3);
}

describe("favicon — green family", () => {
  it("SVG viewBox, palette, glyph, and token rectangles", () => {
    const svg = readFileSync(resolve(PUBLIC_DIR, "favicon.svg"), "utf8");
    validateSvg(svg);
  });

  it("index.html links carry version query and the right sizes/types", () => {
    const html = readFileSync(resolve(REPO_ROOT, "index.html"), "utf8");
    expect(html).toMatch(
      /<link\s+rel="icon"\s+type="image\/png"\s+sizes="32x32"\s+href="\/favicon-32\.png\?v=family-green-1"\s*\/>/,
    );
    expect(html).toMatch(
      /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="\/favicon\.svg\?v=family-green-1"\s*\/>/,
    );
    expect(html).toMatch(
      /<link\s+rel="apple-touch-icon"\s+sizes="180x180"\s+href="\/apple-touch-icon\.png\?v=family-green-1"\s*\/>/,
    );
  });

  it("favicon-32.png has valid PNG signature and IHDR 32x32", () => {
    const png = readFileSync(resolve(PUBLIC_DIR, "favicon-32.png"));
    expectPngSignature(png);
    const ihdr = readIhdr(png);
    expect(ihdr.width).toBe(32);
    expect(ihdr.height).toBe(32);
  });

  it("apple-touch-icon.png has valid PNG signature and IHDR 180x180", () => {
    const png = readFileSync(resolve(PUBLIC_DIR, "apple-touch-icon.png"));
    expectPngSignature(png);
    const ihdr = readIhdr(png);
    expect(ihdr.width).toBe(180);
    expect(ihdr.height).toBe(180);
  });

  it("rejects a wrong-label SVG with the same validator", () => {
    const wrongLabel = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#c8ff36"/>
  <rect x="10" y="10" width="60" height="300" fill="#121310"/>
  <rect x="90" y="10" width="60" height="300" fill="#121310"/>
  <rect x="170" y="10" width="60" height="300" fill="#121310"/>
  <text x="160" y="180" fill="#0c0d0a" text-anchor="middle">XYZ</text>
</svg>`;
    expect(() => validateSvg(wrongLabel)).toThrow();
  });

  it("rejects a green→blue recolor SVG with the same validator", () => {
    const blueRecolor = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#3b82f6"/>
  <rect x="10" y="10" width="60" height="300" fill="#121310"/>
  <rect x="90" y="10" width="60" height="300" fill="#121310"/>
  <rect x="170" y="10" width="60" height="300" fill="#121310"/>
  <text x="160" y="180" fill="#0c0d0a" text-anchor="middle">TFL</text>
</svg>`;
    expect(() => validateSvg(blueRecolor)).toThrow();
  });
});