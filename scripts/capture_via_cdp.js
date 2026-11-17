import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const outDir = "/Users/shivanshsaxena/.gemini/antigravity/brain/b5dc1f24-47ca-4e39-ac09-9beddeb6111b/screenshots";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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
  { label: "1440px", width: 1440, height: 900, mobile: false },
  { label: "390px", width: 390, height: 844, mobile: true },
];

function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data.toString());
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (err) {}
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function getTabInfo(port, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/json`, (res) => {
          let buf = "";
          res.on("data", (chunk) => (buf += chunk));
          res.on("end", () => resolve(buf));
        });
        req.on("error", reject);
      });
      const parsed = JSON.parse(data);
      if (parsed && parsed.length > 0 && parsed[0].webSocketDebuggerUrl) {
        return parsed[0];
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw new Error("Could not connect to Chrome debugging port");
}

async function main() {
  const port = 9225;
  console.log(`Starting Chrome with remote debugging on port ${port}...`);
  const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
    "--headless",
    `--remote-debugging-port=${port}`,
    "--user-data-dir=/tmp/chrome-cdp-profile",
    "--hide-scrollbars",
    "--window-size=1440,900",
    "about:blank",
  ]);

  const tabInfo = await getTabInfo(port);

  const ws = new WebSocket(tabInfo.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  await sendCDP(ws, "Page.enable");
  await sendCDP(ws, "DOM.enable");

  console.log("Connected to Chrome via CDP. Capturing pages...");

  for (const page of pages) {
    for (const vp of viewports) {
      const filename = `${page.name}_${vp.label}.png`;
      const outPath = path.join(outDir, filename);
      const url = `http://localhost:3001${page.path}`;

      console.log(`Setting viewport: ${vp.width}x${vp.height} (mobile: ${vp.mobile})...`);
      await sendCDP(ws, "Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });

      console.log(`Navigating to ${url}...`);
      await sendCDP(ws, "Page.navigate", { url });
      // Wait for page to render and canvas pixel scenes to draw
      await new Promise((r) => setTimeout(r, 1200));

      const { data } = await sendCDP(ws, "Page.captureScreenshot", {
        format: "png",
      });

      const buffer = Buffer.from(data, "base64");
      fs.writeFileSync(outPath, buffer);
      console.log(`✓ Saved ${filename} (${buffer.length} bytes)`);
    }
  }

  ws.close();
  chrome.kill();
  console.log("All 18 screenshots captured successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
