import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
    inspectorPort: false
  }),
  session: {
    driver: sessionDrivers.lruCache()
  },
  vite: {
    server: {
      host: true
    }
  }
});
