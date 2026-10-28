import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const legacy = new Set(["character-rules.test.mjs", "patch-1.2.test.mjs"]);
const files = readdirSync("tests").filter(f => f.endsWith(".test.mjs") && !legacy.has(f)).sort().map(f => `tests/${f}`);
const result = spawnSync(process.execPath, ["--experimental-vm-modules", "--test", "--test-concurrency=1", ...files], { stdio: "inherit" });
process.exit(result.status ?? 1);
