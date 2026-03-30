import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";

const clientDir = new URL("../dist/client/", import.meta.url);
const serverDir = new URL("../dist/server/", import.meta.url);
const outputDir = new URL("../dist-pages/", import.meta.url);
const outputServerDir = new URL("./server/", outputDir);
const serverWranglerPath = new URL("./wrangler.json", serverDir);
const rootWranglerPath = new URL("../wrangler.jsonc", import.meta.url);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(clientDir, outputDir, { recursive: true });
await mkdir(outputServerDir, { recursive: true });

for (const entry of await readdir(serverDir, { withFileTypes: true })) {
  if (entry.name === ".dev.vars" || entry.name === "wrangler.json") {
    continue;
  }

  await cp(new URL(entry.name, serverDir), new URL(entry.name, outputServerDir), {
    recursive: true
  });
}

await writeFile(new URL("_worker.js", outputDir), 'export { default } from "./server/entry.mjs";\n');
await writeFile(
  new URL(".assetsignore", outputDir),
  ["_worker.js", "server", "wrangler.json", ".dev.vars"].join("\n") + "\n"
);

const rawServerConfig = await readFile(serverWranglerPath, "utf8");
const serverConfig = JSON.parse(rawServerConfig);
const rawRootConfig = await readFile(rootWranglerPath, "utf8");
const rootConfig = JSON.parse(rawRootConfig);

const sanitizedServerConfig = {
  name: serverConfig.name,
  main: serverConfig.main,
  compatibility_date: rootConfig.compatibility_date ?? serverConfig.compatibility_date,
  compatibility_flags: rootConfig.compatibility_flags ?? serverConfig.compatibility_flags,
  no_bundle: serverConfig.no_bundle,
  rules: serverConfig.rules,
  vars: rootConfig.vars ?? serverConfig.vars,
  d1_databases: rootConfig.d1_databases ?? serverConfig.d1_databases
};

await writeFile(serverWranglerPath, `${JSON.stringify(sanitizedServerConfig, null, 2)}\n`);
