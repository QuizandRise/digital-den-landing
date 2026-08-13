import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const accessJs = readFileSync("workspace-access.js", "utf8");
assert.match(accessJs, /Open workspace|open-workspace-button/);
assert.match(accessJs, /probeSession/);
assert.match(accessJs, /returnTo/);
assert.match(accessJs, /session has ended|secure link has ended/);
assert.doesNotMatch(accessJs, /localStorage/);
assert.doesNotMatch(accessJs, /\?token=/);
assert.doesNotMatch(accessJs, /Forbidden/);

const accessHtml = readFileSync("workspace-access.html", "utf8");
assert.match(accessHtml, /open-workspace-button/);
assert.match(accessHtml, /Sign out of this device/);

const app = readFileSync("dashboard-next/src/app.js", "utf8");
assert.match(app, /Start a new project/);
assert.match(app, /notification-count|Notifications/);
assert.match(app, /returnTo/);
assert.match(app, /serviceWorker/);
assert.match(app, /Sign out of this device/);
assert.match(app, /Send me a secure link|workspace-access\.html/);
assert.doesNotMatch(app, /localStorage\.(setItem|getItem)\(["']token/);
assert.match(app, /Only projects linked to your verified account/);

const manifest = JSON.parse(readFileSync("dashboard-next/manifest.webmanifest", "utf8"));
assert.equal(manifest.name, "Digital Den Workspace");
assert.equal(manifest.short_name, "Digital Den");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/dashboard-next/#overview");
assert.ok(manifest.icons.some(icon => icon.purpose === "maskable"));

const sw = readFileSync("dashboard-next/sw.js", "utf8");
assert.match(sw, /\/api\/digital-den\//);
assert.match(sw, /cache: "no-store"/);
assert.match(sw, /offline\.html/);
assert.doesNotMatch(sw, /session token|Authorization|clientEmail/);

const offline = readFileSync("dashboard-next/offline.html", "utf8");
assert.match(offline, /offline/i);
assert.doesNotMatch(offline, /@|projectId|clientEmail|GBP/);

const indexHtml = readFileSync("dashboard-next/index.html", "utf8");
assert.match(indexHtml, /manifest.webmanifest/);
assert.match(indexHtml, /apple-touch-icon/);
assert.match(indexHtml, /notifications-button/);

const publicHtml = readFileSync("index.html", "utf8");
assert.match(publicHtml, /workspace-access\.html/);
assert.match(publicHtml, /Open workspace/);
assert.doesNotMatch(publicHtml, /localStorage/);

const fileUpload = readFileSync("dashboard-next/src/file-upload-actions.js", "utf8");
assert.match(fileUpload, /files\/limits/);
assert.match(fileUpload, /maxBytes/);

console.log("Digital Den client workspace / PWA tests passed.");
