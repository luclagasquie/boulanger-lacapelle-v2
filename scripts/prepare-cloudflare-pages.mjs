import { readFile, writeFile } from "node:fs/promises";

const wranglerPath = new URL("../dist/server/wrangler.json", import.meta.url);

const rawConfig = await readFile(wranglerPath, "utf8");
const config = JSON.parse(rawConfig);

delete config.configPath;
delete config.userConfigPath;
delete config.topLevelName;
delete config.definedEnvironments;
delete config.legacy_env;
delete config.jsx_factory;
delete config.jsx_fragment;
delete config.pages_build_output_dir;
delete config.triggers;
delete config.assets;
delete config.images;
delete config.kv_namespaces;
delete config.durable_objects;
delete config.workflows;
delete config.migrations;
delete config.cloudchamber;
delete config.send_email;
delete config.queues;
delete config.r2_buckets;
delete config.vectorize;
delete config.ai_search_namespaces;
delete config.ai_search;
delete config.hyperdrive;
delete config.services;
delete config.analytics_engine_datasets;
delete config.dispatch_namespaces;
delete config.mtls_certificates;
delete config.pipelines;
delete config.secrets_store_secrets;
delete config.unsafe_hello_world;
delete config.worker_loaders;
delete config.ratelimits;
delete config.vpc_services;
delete config.logfwdr;
delete config.python_modules;
delete config.dev;

const sanitizedConfig = {
  name: config.name,
  main: config.main,
  compatibility_date: config.compatibility_date,
  compatibility_flags: config.compatibility_flags,
  no_bundle: config.no_bundle,
  rules: config.rules,
  vars: config.vars,
  d1_databases: config.d1_databases
};

await writeFile(wranglerPath, `${JSON.stringify(sanitizedConfig, null, 2)}\n`);
