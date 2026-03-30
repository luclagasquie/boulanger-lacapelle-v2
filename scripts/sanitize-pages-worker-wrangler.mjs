import { readFile, writeFile } from "node:fs/promises";

const workerWranglerPath = new URL("../dist/_worker.js/wrangler.json", import.meta.url);
const rootWranglerPath = new URL("../wrangler.jsonc", import.meta.url);

const rawWorkerConfig = await readFile(workerWranglerPath, "utf8");
const workerConfig = JSON.parse(rawWorkerConfig);
const rawRootConfig = await readFile(rootWranglerPath, "utf8");
const rootConfig = JSON.parse(rawRootConfig);

const sanitizedWorkerConfig = {
  name: workerConfig.name,
  main: workerConfig.main,
  compatibility_date: rootConfig.compatibility_date ?? workerConfig.compatibility_date,
  compatibility_flags: rootConfig.compatibility_flags ?? workerConfig.compatibility_flags,
  no_bundle: workerConfig.no_bundle,
  rules: workerConfig.rules,
  vars: rootConfig.vars ?? workerConfig.vars,
  d1_databases: rootConfig.d1_databases ?? workerConfig.d1_databases
};

await writeFile(workerWranglerPath, `${JSON.stringify(sanitizedWorkerConfig, null, 2)}\n`);
