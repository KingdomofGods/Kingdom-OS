import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const ENGINE = "directives-engine";
const VERSION = "0.1.0";

function nowIso(){ return new Date().toISOString(); }
function die(code, msg){
  process.stdout.write(JSON.stringify({engine:ENGINE,version:VERSION,at:nowIso(),command:"error",payload:{message:msg},meta:{code}}, null, 2) + "\n");
  process.exit(code);
}
function sha256(s){ return crypto.createHash("sha256").update(s, "utf8").digest("hex"); }

function readText(p){
  return fs.readFileSync(p, "utf8");
}
function statText(text){
  const lines = text.split(/\r?\n/).length;
  const bytes = Buffer.byteLength(text, "utf8");
  return { lines, bytes, sha256: sha256(text) };
}

function root(){
  // tools/directives-engine/directives-engine.mjs -> repo root
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
}

const cmd = (process.argv[2] ?? "help").toLowerCase();
const out = (process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out")+1] : null);

const targets = [
  { id:"ghostfire-ops", path:"maps/10-ghostfire-ops/README.md" },
  { id:"activate-the-kingdom", path:"maps/20-activate-the-kingdom/README.md" }
];

const ban = ["Paste the ","PASTE THE FULL","Include:","...paste directives..."];
const min = 600;

function validateOne(fullPath){
  if (!fs.existsSync(fullPath)) return { ok:false, error:`Missing: ${fullPath}` };
  const text = readText(fullPath);
  if (text.trim().length < min) return { ok:false, error:`Too small (<${min} chars): ${fullPath}` };
  for (const b of ban) if (text.includes(b)) return { ok:false, error:`Placeholder text present (${b}): ${fullPath}` };
  return { ok:true, text };
}

function packet(command, payload, meta={}){
  return { engine:ENGINE, version:VERSION, at:nowIso(), command, payload, meta };
}

if (cmd === "doctor"){
  process.stdout.write(JSON.stringify(packet("doctor", {
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    repoRoot: root()
  }), null, 2) + "\n");
  process.exit(0);
}

if (cmd === "validate"){
  const rr = root();
  const results = [];
  for (const t of targets){
    const p = path.join(rr, t.path);
    const r = validateOne(p);
    results.push({ id:t.id, path:t.path, ok:r.ok, error:r.ok?null:r.error });
    if (!r.ok) die(2, r.error);
  }
  process.stdout.write(JSON.stringify(packet("validate", { ok:true, results }), null, 2) + "\n");
  process.exit(0);
}

if (cmd === "pack"){
  const rr = root();
  const directives = {};
  for (const t of targets){
    const p = path.join(rr, t.path);
    const r = validateOne(p);
    if (!r.ok) die(2, r.error);
    directives[t.id] = { path:t.path, ...statText(r.text) };
  }
  const packed = packet("pack", { directives });

  if (out){
    const outPath = path.isAbsolute(out) ? out : path.join(rr, out);
    fs.mkdirSync(path.dirname(outPath), { recursive:true });
    fs.writeFileSync(outPath, JSON.stringify(packed, null, 2) + "\n", "utf8");
  }

  process.stdout.write(JSON.stringify(packed, null, 2) + "\n");
  process.exit(0);
}

process.stdout.write(JSON.stringify(packet("help", {
  usage: [
    "node tools/directives-engine/directives-engine.mjs doctor",
    "node tools/directives-engine/directives-engine.mjs validate",
    "node tools/directives-engine/directives-engine.mjs pack --out data/directives.packet.json"
  ]
}), null, 2) + "\n");
