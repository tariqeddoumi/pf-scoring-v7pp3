/**
 * Generate prisma/schema.prisma from prisma/schema.template.prisma.
 *
 * This allows each deployment to choose a database table prefix without
 * manually editing the Prisma schema.
 */
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const templatePath = path.join(repoRoot, "prisma", "schema.template.prisma");
const outputPath = path.join(repoRoot, "prisma", "schema.prisma");
const prefix = process.env.TABLE_PREFIX || "BCP_SCORE_GP";

if (!/^[A-Z0-9_]+$/.test(prefix)) {
  throw new Error(`Invalid TABLE_PREFIX: ${prefix}. Use only A-Z, 0-9 and _.`);
}

const template = fs.readFileSync(templatePath, "utf8");
const generated = template.replace(/__TABLE_PREFIX__/g, prefix);
fs.writeFileSync(outputPath, generated, "utf8");
console.log(`Generated prisma/schema.prisma with prefix ${prefix}`);
