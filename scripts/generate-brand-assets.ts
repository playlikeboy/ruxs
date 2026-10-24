import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const brandDir = join(root, "public/brand");
const appDir = join(root, "src/app");
mkdirSync(brandDir, { recursive: true });

// 1. Core SVG Definitions

// The Master RUXs App Icon (512x512)
const ruxsAppIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc" fill="none">
  <title id="title">RUXs App Icon</title>
  <desc id="desc">Neighbourhood house gable forming an architectural R with morning sun and leaf.</desc>
  <defs>
    <linearGradient id="terracottaGrad" x1="160" y1="110" x2="360" y2="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F05A3E"/>
      <stop offset="100%" stop-color="#BD4B2A"/>
    </linearGradient>
    <linearGradient id="forestGrad" x1="160" y1="140" x2="160" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#096649"/>
      <stop offset="100%" stop-color="#054531"/>
    </linearGradient>
    <linearGradient id="leafGrad" x1="240" y1="260" x2="370" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34A853"/>
      <stop offset="100%" stop-color="#1E7E34"/>
    </linearGradient>
    <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD15C"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </radialGradient>
  </defs>

  <!-- Squircle Canvas Background -->
  <rect width="512" height="512" rx="116" fill="#FFFDF8"/>
  <rect x="6" y="6" width="500" height="500" rx="110" stroke="#EAE3D5" stroke-width="8"/>
  
  <!-- Subtle Ambient Hearth Warmth -->
  <circle cx="256" cy="256" r="175" fill="#FFF2E7" opacity="0.85"/>

  <!-- Master Architectural Emblem -->
  <g transform="translate(10, 0)">
    <!-- Grounding Foundation Pillar (Forest Green) -->
    <rect x="146" y="156" width="52" height="236" rx="26" fill="url(#forestGrad)"/>

    <!-- Pitched Roof & 'R' Gable Loop (Terracotta) -->
    <path d="M172 182 L248 116 C255 110 265 110 272 116 L344 178 C370 200 372 240 348 266 C326 290 288 292 258 274 L198 238" 
          fill="none" 
          stroke="url(#terracottaGrad)" 
          stroke-width="50" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>

    <!-- Morning Sun / Hearth inside Gable -->
    <circle cx="266" cy="198" r="24" fill="url(#sunGrad)"/>

    <!-- Sweeping Fresh Leaf Leg (Emerald Green) -->
    <path d="M246 256 C262 292 296 348 354 380 C364 386 360 398 348 396 C290 388 244 326 226 280 Z" 
          fill="url(#leafGrad)"/>
  </g>
</svg>`;

// The Maskable Icon (Full bleed background, centered 76% emblem for Android circle/rounded-rect crops)
const ruxsAppIconMaskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" fill="none">
  <defs>
    <linearGradient id="terracottaGradM" x1="160" y1="110" x2="360" y2="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F05A3E"/>
      <stop offset="100%" stop-color="#BD4B2A"/>
    </linearGradient>
    <linearGradient id="forestGradM" x1="160" y1="140" x2="160" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#096649"/>
      <stop offset="100%" stop-color="#054531"/>
    </linearGradient>
    <linearGradient id="leafGradM" x1="240" y1="260" x2="370" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34A853"/>
      <stop offset="100%" stop-color="#1E7E34"/>
    </linearGradient>
    <radialGradient id="sunGradM" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD15C"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </radialGradient>
  </defs>

  <!-- Full Bleed Background -->
  <rect width="512" height="512" fill="#FFFDF8"/>
  <circle cx="256" cy="256" r="190" fill="#FFF2E7" opacity="0.85"/>

  <!-- Centered Scaled Emblem for Safe Zone -->
  <g transform="translate(64, 64) scale(0.75)">
    <rect x="146" y="156" width="52" height="236" rx="26" fill="url(#forestGradM)"/>
    <path d="M172 182 L248 116 C255 110 265 110 272 116 L344 178 C370 200 372 240 348 266 C326 290 288 292 258 274 L198 238" 
          fill="none" 
          stroke="url(#terracottaGradM)" 
          stroke-width="50" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
    <circle cx="266" cy="198" r="24" fill="url(#sunGradM)"/>
    <path d="M246 256 C262 292 296 348 354 380 C364 386 360 398 348 396 C290 388 244 326 226 280 Z" 
          fill="url(#leafGradM)"/>
  </g>
</svg>`;

// The Master RUXs Logo (512x512 with Mark + Typographic Wordmark)
const ruxsAppLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="logoTitle logoDesc" fill="none">
  <title id="logoTitle">RUXs Official Logo</title>
  <desc id="logoDesc">RUXs emblem with brand name and neighbourhood services tagline.</desc>
  <defs>
    <linearGradient id="terracottaL" x1="160" y1="110" x2="360" y2="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F05A3E"/>
      <stop offset="100%" stop-color="#BD4B2A"/>
    </linearGradient>
    <linearGradient id="forestL" x1="160" y1="140" x2="160" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#096649"/>
      <stop offset="100%" stop-color="#054531"/>
    </linearGradient>
    <linearGradient id="leafL" x1="240" y1="260" x2="370" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34A853"/>
      <stop offset="100%" stop-color="#1E7E34"/>
    </linearGradient>
    <radialGradient id="sunL" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD15C"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </radialGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="#FFFDF8"/>
  <rect x="6" y="6" width="500" height="500" rx="110" stroke="#EAE3D5" stroke-width="8"/>
  <circle cx="256" cy="200" r="140" fill="#FFF2E7" opacity="0.85"/>

  <!-- Centered Emblem (shifted up for wordmark balance) -->
  <g transform="translate(68, 22) scale(0.72)">
    <rect x="146" y="156" width="52" height="236" rx="26" fill="url(#forestL)"/>
    <path d="M172 182 L248 116 C255 110 265 110 272 116 L344 178 C370 200 372 240 348 266 C326 290 288 292 258 274 L198 238" 
          fill="none" 
          stroke="url(#terracottaL)" 
          stroke-width="50" 
          stroke-linecap="round" 
          stroke-linejoin="round"/>
    <circle cx="266" cy="198" r="24" fill="url(#sunL)"/>
    <path d="M246 256 C262 292 296 348 354 380 C364 386 360 398 348 396 C290 388 244 326 226 280 Z" 
          fill="url(#leafL)"/>
  </g>

  <!-- Wordmark -->
  <text x="256" y="394" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', Roboto, sans-serif" font-size="68" font-weight="900" letter-spacing="-0.04em" fill="#07583F">
    RUX<tspan fill="#E95135">s</tspan>
  </text>
  
  <!-- Tagline -->
  <text x="256" y="432" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="750" letter-spacing="0.16em" fill="#716C62">
    NEIGHBOURHOOD SERVICES
  </text>
  
  <text x="256" y="458" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" letter-spacing="0.04em" fill="#07583F">
    A good neighbour, made easy to find
  </text>
</svg>`;

// The Horizontal Vector Logo
const ruxsLogoHorizontalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 120" role="img" fill="none">
  <defs>
    <linearGradient id="terracottaH" x1="160" y1="110" x2="360" y2="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F05A3E"/>
      <stop offset="100%" stop-color="#BD4B2A"/>
    </linearGradient>
    <linearGradient id="forestH" x1="160" y1="140" x2="160" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#096649"/>
      <stop offset="100%" stop-color="#054531"/>
    </linearGradient>
    <linearGradient id="leafH" x1="240" y1="260" x2="370" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34A853"/>
      <stop offset="100%" stop-color="#1E7E34"/>
    </linearGradient>
    <radialGradient id="sunH" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFD15C"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </radialGradient>
  </defs>

  <!-- Scaled Icon Mark -->
  <g transform="translate(10, 10) scale(0.195)">
    <rect width="512" height="512" rx="116" fill="#FFFDF8"/>
    <rect x="6" y="6" width="500" height="500" rx="110" stroke="#EAE3D5" stroke-width="8"/>
    <circle cx="256" cy="256" r="175" fill="#FFF2E7" opacity="0.85"/>
    <g transform="translate(10, 0)">
      <rect x="146" y="156" width="52" height="236" rx="26" fill="url(#forestH)"/>
      <path d="M172 182 L248 116 C255 110 265 110 272 116 L344 178 C370 200 372 240 348 266 C326 290 288 292 258 274 L198 238" 
            fill="none" 
            stroke="url(#terracottaH)" 
            stroke-width="50" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      <circle cx="266" cy="198" r="24" fill="url(#sunH)"/>
      <path d="M246 256 C262 292 296 348 354 380 C364 386 360 398 348 396 C290 388 244 326 226 280 Z" 
            fill="url(#leafH)"/>
    </g>
  </g>

  <!-- Wordmark -->
  <text x="132" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', Roboto, sans-serif" font-size="58" font-weight="900" letter-spacing="-0.04em" fill="#07583F">
    RUX<tspan fill="#E95135">s</tspan>
  </text>
  
  <line x1="308" y1="36" x2="308" y2="84" stroke="#EAE3D5" stroke-width="2"/>

  <!-- Subtitle -->
  <text x="326" y="53" font-family="-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" letter-spacing="0.14em" fill="#07583F">
    NEIGHBOURHOOD SERVICES
  </text>
  <text x="326" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Geist', 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" letter-spacing="0.01em" fill="#716C62">
    Everyday essentials &bull; Kids learning &bull; Local care
  </text>
</svg>`;

// Write SVGs to public directories
writeFileSync(join(brandDir, "ruxs-app-icon.svg"), ruxsAppIconSvg);
writeFileSync(join(brandDir, "ruxs-app-logo.svg"), ruxsAppLogoSvg);
writeFileSync(join(brandDir, "ruxs-logo-horizontal.svg"), ruxsLogoHorizontalSvg);
writeFileSync(join(root, "public/ruxs-neighbourhood-mark.svg"), ruxsAppIconSvg);

console.log("Vector SVGs created successfully!");

// 2. Launch Chromium and Render Pixel-Perfect Raster Assets
async function generateRasters() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  const page = await browser.newPage({
    deviceScaleFactor: 2, // Crisp retina output
  });

  // Render 512x512 Icon
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${ruxsAppIconSvg}</body></html>`);
  await page.screenshot({ path: join(brandDir, "ruxs-app-icon-512.png"), omitBackground: true });
  await page.screenshot({ path: join(appDir, "icon.png"), omitBackground: true });

  // Render 192x192 Icon & Apple Icon
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: join(brandDir, "ruxs-app-icon-192.png"), omitBackground: true });
  await page.screenshot({ path: join(appDir, "apple-icon.png"), omitBackground: true });

  // Render 512x512 Maskable
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#FFFDF8;">${ruxsAppIconMaskableSvg}</body></html>`);
  await page.screenshot({ path: join(brandDir, "ruxs-app-icon-maskable-512.png") });

  // Render 192x192 Maskable
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: join(brandDir, "ruxs-app-icon-maskable-192.png") });

  // Render 512x512 Full Logo
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${ruxsAppLogoSvg}</body></html>`);
  await page.screenshot({ path: join(brandDir, "ruxs-app-logo.png"), omitBackground: true });

  // Render 1200x630 OpenGraph Master Image
  const ogHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: #FFFDF8;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #20241F;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 64px 48px;
  }
  .bg-glow-1 {
    position: absolute;
    top: -120px;
    left: -100px;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(233, 81, 53, 0.08) 0%, rgba(255, 253, 248, 0) 70%);
    pointer-events: none;
  }
  .bg-glow-2 {
    position: absolute;
    bottom: -150px;
    right: -100px;
    width: 550px;
    height: 550px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(7, 88, 63, 0.08) 0%, rgba(255, 253, 248, 0) 70%);
    pointer-events: none;
  }
  .frame-border {
    position: absolute;
    inset: 20px;
    border: 1.5px solid #EAE3D5;
    border-radius: 28px;
    pointer-events: none;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }
  .brand-lockup {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .brand-name {
    font-size: 38px;
    font-weight: 900;
    color: #07583F;
    letter-spacing: -0.04em;
    line-height: 1;
  }
  .brand-name span { color: #E95135; }
  .brand-tagline {
    font-size: 13px;
    font-weight: 750;
    color: #716C62;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .badge-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid #E2DCD0;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 650;
    color: #07583F;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2F7D4F;
    box-shadow: 0 0 0 3px rgba(47, 125, 79, 0.2);
  }
  .hero-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 1040px;
    position: relative;
    z-index: 2;
    margin-top: 4px;
  }
  .headline {
    font-size: 52px;
    font-weight: 850;
    letter-spacing: -0.035em;
    line-height: 1.1;
    color: #1A1F1B;
  }
  .headline em { font-style: normal; color: #BD4B2A; }
  .subhead {
    font-size: 21px;
    color: #635E54;
    line-height: 1.4;
    font-weight: 450;
    max-width: 980px;
  }
  .cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    position: relative;
    z-index: 2;
    margin-top: 4px;
  }
  .feature-card {
    background: #FFFFFF;
    border: 1px solid #EAE3D5;
    border-radius: 18px;
    padding: 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.02);
  }
  .card-pill {
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .pill-tiffin { background: #FFE8DD; color: #BD4B2A; }
  .pill-water { background: #E0F2FE; color: #0284C7; }
  .pill-kids { background: #FEF3C7; color: #B45309; }
  .pill-local { background: #DCFCE7; color: #15803D; }

  .card-title {
    font-size: 17px;
    font-weight: 750;
    color: #1A1F1B;
    letter-spacing: -0.01em;
  }
  .card-desc {
    font-size: 12.5px;
    color: #716C62;
    line-height: 1.4;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 2;
    padding-top: 14px;
    border-top: 1px solid #EAE3D5;
  }
  .footer-pills {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 14px;
    font-weight: 600;
    color: #716C62;
  }
  .footer-pills span {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #20241F;
  }
  .check-icon { color: #07583F; font-weight: bold; }
  .footer-domain {
    font-size: 18px;
    font-weight: 750;
    color: #07583F;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .domain-dot { color: #E95135; }
</style>
</head>
<body>
<div class="bg-glow-1"></div>
<div class="bg-glow-2"></div>
<div class="frame-border"></div>

<div class="header">
  <div class="brand-lockup">
    <div style="width: 58px; height: 58px;">
      ${ruxsAppIconSvg}
    </div>
    <div class="brand-text">
      <div class="brand-name">RUX<span>s</span></div>
      <div class="brand-tagline">Neighbourhood Services</div>
    </div>
  </div>

  <div class="badge-chip">
    <div class="pulse-dot"></div>
    <span>A good neighbour, made easy to find</span>
  </div>
</div>

<div class="hero-content">
  <h1 class="headline">More of everyday life, <em>sorted locally.</em></h1>
  <p class="subhead">Discover nearby tiffin meals, 20L water cans & fresh dairy — plus kids' learning academies, DIY kits and verified neighbourhood specialists.</p>
</div>

<div class="cards-grid">
  <div class="feature-card">
    <div class="card-pill pill-tiffin">Daily Meals</div>
    <div class="card-title">Tiffin Subscriptions</div>
    <div class="card-desc">Flexible daily lunch & dinner with 1-tap Deliver/Skip before cutoff.</div>
  </div>
  <div class="feature-card">
    <div class="card-pill pill-water">Water & Dairy</div>
    <div class="card-title">20L Cans & Milk</div>
    <div class="card-desc">Scheduled morning doorstep drops, can return tracking & zero missed days.</div>
  </div>
  <div class="feature-card">
    <div class="card-pill pill-kids">Kids Zone</div>
    <div class="card-title">10 Academies</div>
    <div class="card-desc">STEM, chess, coding, dance, art, holiday camps & certified non-toxic kits.</div>
  </div>
  <div class="feature-card">
    <div class="card-pill pill-local">Specialists</div>
    <div class="card-title">Gifts & Wellness</div>
    <div class="card-desc">Verified mehndi artists, fitness trainers, physio & custom gifts via direct UPI.</div>
  </div>
</div>

<div class="footer">
  <div class="footer-pills">
    <span><strong class="check-icon">&#10003;</strong> 0% Commission</span>
    <span>&bull;</span>
    <span><strong class="check-icon">&#10003;</strong> Private Household Links</span>
    <span>&bull;</span>
    <span><strong class="check-icon">&#10003;</strong> Direct UPI Payments</span>
    <span>&bull;</span>
    <span><strong class="check-icon">&#10003;</strong> Verified Local Providers</span>
  </div>
  <div class="footer-domain">
    ruxs<span class="domain-dot">.</span>in
  </div>
</div>
</body>
</html>`;

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(ogHtml);
  
  // Write to both brand/ruxs-og.png, public/og.png and public/opengraph-image.png
  await page.screenshot({ path: join(brandDir, "ruxs-og.png") });
  await page.screenshot({ path: join(root, "public/og.png") });
  await page.screenshot({ path: join(root, "public/opengraph-image.png") });

  await browser.close();
  console.log("Retina raster assets and OG images generated successfully!");
}

generateRasters().catch((err) => {
  console.error("Error generating raster assets:", err);
  process.exit(1);
});
