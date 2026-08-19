import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: join(root, ".env") });

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("file:")) process.exit(0);

const src = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
writeFileSync(join(root, "prisma/schema.local.prisma"), src.replace('provider = "postgresql"', 'provider = "sqlite"'));

function run(args) {
  const result = spawnSync("npx", args, { cwd: root, stdio: "inherit", shell: true });
  if (result.status) process.exit(result.status ?? 1);
}

run(["prisma", "generate", "--schema=prisma/schema.local.prisma"]);
run(["prisma", "db", "push", "--schema=prisma/schema.local.prisma", "--accept-data-loss"]);

const dbFile = join(root, "prisma/dev.db");
const seeded = join(root, "prisma/.seeded");
if (existsSync(dbFile) && !existsSync(seeded)) {
  run(["tsx", "prisma/seed.ts"]);
  writeFileSync(seeded, "ok");
}
