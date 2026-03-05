import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(bin, args) {
  const result = spawnSync(bin, args, {
    stdio: "inherit",
    env: process.env,
  });

  return result.status ?? 1;
}

function listMigrationDirs(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) return [];
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

function migrationsAreComplete(migrationsDir) {
  const dirs = listMigrationDirs(migrationsDir);
  if (dirs.length === 0) return { hasAny: false, complete: true, missing: [] };

  const missing = [];
  for (const dir of dirs) {
    const migrationSql = path.join(migrationsDir, dir, "migration.sql");
    if (!fs.existsSync(migrationSql)) missing.push(path.join("prisma", "migrations", dir, "migration.sql"));
  }

  return { hasAny: true, complete: missing.length === 0, missing };
}

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
const status = migrationsAreComplete(migrationsDir);

const isVercel = Boolean(process.env.VERCEL);
const forceMigrateDeploy = process.env.PRISMA_MIGRATE_DEPLOY === "true";

let prismaExit = 0;
if (isVercel && !forceMigrateDeploy) {
  // Vercel builds can hit Prisma P3015 due to migration file resolution/caching.
  // Default to db push to keep builds deterministic.
  console.log("Vercel detected: running `prisma db push --accept-data-loss` (set PRISMA_MIGRATE_DEPLOY=true to use migrations).\n");
  prismaExit = run("prisma", ["db", "push", "--accept-data-loss"]);
} else if (status.hasAny && status.complete) {
  prismaExit = run("prisma", ["migrate", "deploy"]);
  if (prismaExit !== 0) {
    prismaExit = run("prisma", ["db", "push", "--accept-data-loss"]);
  }
} else {
  if (status.missing.length > 0) {
    console.warn("Prisma migrations are incomplete. Missing files:");
    for (const p of status.missing) console.warn(`- ${p}`);
    console.warn("Falling back to `prisma db push --accept-data-loss`.\n");
  }
  prismaExit = run("prisma", ["db", "push", "--accept-data-loss"]);
}

if (prismaExit !== 0) {
  console.warn("⚠️  Prisma step failed (exit code " + prismaExit + "). DATABASE_URL may be unavailable. Continuing with Next.js build...\n");
}

// Next.js 16 enables Turbopack by default for builds. This project uses a custom
// webpack config (see `next.config.js`), so explicitly select webpack.
const nextExit = run("next", ["build", "--webpack"]);
process.exit(nextExit);
