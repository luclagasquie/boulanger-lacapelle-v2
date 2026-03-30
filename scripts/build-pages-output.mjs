import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";

const clientDir = new URL("../dist/client/", import.meta.url);
const serverDir = new URL("../dist/server/", import.meta.url);
const outputDir = new URL("../dist-pages/", import.meta.url);
const outputServerDir = new URL("./server/", outputDir);

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
