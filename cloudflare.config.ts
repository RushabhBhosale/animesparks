import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "animesparks",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-07",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      CONTENT_SOURCE: bindings.text("mongodb"),
      MONGODB_URI: bindings.secret(),
      MONGODB_DB_NAME: bindings.text("animesparks"),
      MONGODB_MAX_POOL_SIZE: bindings.text("2"),
      R2_PUBLIC_BASE_URL: bindings.text("https://images.animesparks.blog"),
      NEXT_PUBLIC_SITE_URL: bindings.text("https://www.animesparks.blog"),
      NEXT_PUBLIC_SANITY_PROJECT_ID: bindings.secret(),
      NEXT_PUBLIC_SANITY_DATASET: bindings.secret(),
      NEXT_PUBLIC_SANITY_API_VERSION: bindings.secret(),
      SANITY_WRITE_TOKEN: bindings.secret(),
      BLOG_PUBLISH_KEY: bindings.secret(),
      GA_PROPERTY_ID: bindings.secret(),
      GA_CLIENT_EMAIL: bindings.secret(),
      GA_PRIVATE_KEY: bindings.secret(),
      VINEXT_KV_CACHE: bindings.kv(),
    },
  }),
});
