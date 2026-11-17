import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const outDir = "/Users/shivanshsaxena/.gemini/antigravity/brain/b5dc1f24-47ca-4e39-ac09-9beddeb6111b/screenshots";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const pages = [
  { name: "01_landing", path: "/" },
  { name: "02_dashboard", path: "/dashboard" },
  { name: "03_chat", path: "/chat" },
  { name: "04_tool_resume", path: "/resume" },
  { name: "05_tool_interview", path: "/tools/interview" },
  { name: "06_tool_cover_letter", path: "/cover-letter" },
  { name: "07_tool_cold_email", path: "/cold-email" },
  { name: "08_tool_roadmap", path: "/tools/roadmap" },
  { name: "09_tool_ats", path: "/resume-parser" },
];

const viewports = [
  { label: "1440px", width: 1440, height: 900 },
  { label: "390px", width: 390, height: 844 },
];

async function capture() {
  console.log("Starting screenshot capture of 9 pages at 1440px and 390px...");

  for (const page of pages) {
    for (const vp of viewports) {
      const filename = `${page.name}_${vp.label}.png`;
      const outPath = path.join(outDir, filename);
      const url = `http://localhost:3001${page.path}`;

      console.log(`Capturing ${filename} (${url} @ ${vp.width}x${vp.height})...`);
      try {
        const cmd = `"${chromePath}" --headless --hide-scrollbars --screenshot="${outPath}" --window-size=${vp.width},${vp.height} --virtual-time-budget=2000 "${url}"`;
        execSync(cmd, { stdio: "ignore" });
        if (fs.existsSync(outPath)) {
          const stats = fs.statSync(outPath);
          console.log(`✓ Saved ${filename} (${stats.size} bytes)`);
        } else {
          console.error(`✗ File not created: ${filename}`);
        }
      } catch (err) {
        console.error(`Error capturing ${filename}:`, err.message);
      }
    }
  }

  console.log("Screenshot capture complete!");
}

capture();
