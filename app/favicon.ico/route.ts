import { NextResponse } from 'next/server';

// Serve the SVG icon as a favicon to avoid 404s in dev
export async function GET() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 256 256">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>` +
    `<rect x="16" y="16" width="224" height="224" rx="48" fill="url(#g)"/>` +
    `<g transform="translate(128 128)"><text x="0" y="20" font-family="Inter, Arial, sans-serif" font-size="112" font-weight="800" text-anchor="middle" fill="#ffffff">F</text></g>` +
    `</svg>`;
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  });
}


