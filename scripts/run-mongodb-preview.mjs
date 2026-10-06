import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production") {
  throw new Error("The MongoDB preview runner only starts Next.js development mode.");
}
if (!process.env.MONGODB_URI) {
  throw new Error("Set MONGODB_URI in the local environment before starting the MongoDB preview.");
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    CONTENT_SOURCE: "mongodb",
    MONGODB_DB_NAME: "animesparks_staging",
    R2_PUBLIC_BASE_URL: "https://images.animesparks.blog",
  },
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
