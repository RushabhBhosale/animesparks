import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { kvDataAdapter } from "@vinext/cloudflare/cache/kv-data-adapter";
import { fileURLToPath } from "node:url";

export default defineConfig({
  environments: {
    rsc: {
      resolve: {
        noExternal: ["mongodb", "mongodb-connection-string-url", "tr46", "whatwg-url", "punycode"],
      },
      optimizeDeps: {
        exclude: ["mongodb", "mongodb-connection-string-url", "tr46", "whatwg-url", "punycode"],
      },
    },
    ssr: {
      resolve: {
        noExternal: ["mongodb", "mongodb-connection-string-url", "tr46", "whatwg-url", "punycode"],
      },
      optimizeDeps: {
        exclude: ["mongodb", "mongodb-connection-string-url", "tr46", "whatwg-url", "punycode"],
      },
    },
  },
  plugins: [
    vinext({ cache: { data: kvDataAdapter() } }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  resolve: {
    alias: {
      "punycode/": fileURLToPath(new URL("./node_modules/punycode/punycode.es6.js", import.meta.url)),
      sharp: fileURLToPath(new URL("./empty-stub.js", import.meta.url)),
    },
  },
});
