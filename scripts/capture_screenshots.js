import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Usage: BASE_URL=http://localhost:3000 [JOB_ID=<id>] node scripts/capture_screenshots.js
// Only run it with the dev server up. Signed-in pages need a browser session; without one they capture the
// sign-in redirect. It never reads .env.
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const outDir = process.env.SCREENSHOT_DIR || path.join(process.cwd(), "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const pages = [
  { name: "01_landing", path: "/" },
  { name: "02_home", path: "/dashboard" },
  ...(process.env.JOB_ID ? [{ name: "03_job", path: `/jobs/${process.env.JOB_ID}` }] : []),
  { name: "04_needs_you", path: "/needs-you" },
  { name: "05_applications", path: "/applications" },
  { name: "06_onboarding", path: "/onboarding" },
];

const viewports = [
  { label: "1440", width: 1440, height: 900 },
  { label: "390", width: 390, height: 844 },
];

// preferredColorScheme: 0 = light, 1 = dark (next-themes follows the system setting)
const themes = [
  { label: "light", scheme: 0 },
  { label: "dark", scheme: 1 },
];

function capture() {
  console.log(`Capturing ${pages.length} pages x ${themes.length} themes x ${viewports.length} viewports from ${baseUrl}...`);
  for (const page of pages) {
    for (const theme of themes) {
      for (const vp of viewports) {
        const filename = `${page.name}_${theme.label}_${vp.label}.png`;
        const outPath = path.join(outDir, filename);
        try {
          const cmd = `"${chromePath}" --headless --hide-scrollbars --blink-settings=preferredColorScheme=${theme.scheme} --screenshot="${outPath}" --window-size=${vp.width},${vp.height} --virtual-time-budget=3000 "${baseUrl}${page.path}"`;
          execSync(cmd, { stdio: "ignore" });
          console.log(fs.existsSync(outPath) ? `saved ${filename}` : `missing ${filename}`);
        } catch (err) {
          console.error(`error capturing ${filename}:`, err.message);
        }
      }
    }
  }
  console.log("Screenshot capture complete.");
}

capture();
