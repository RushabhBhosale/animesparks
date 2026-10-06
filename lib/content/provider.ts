
export type ContentSource = "sanity" | "mongodb";

export function getContentSource(env: NodeJS.ProcessEnv = process.env): ContentSource {
  const source = env.CONTENT_SOURCE?.trim().toLowerCase() || "sanity";
  if (source !== "sanity" && source !== "mongodb") {
    throw new Error("CONTENT_SOURCE must be either sanity or mongodb.");
  }
  return source;
}

export function getR2PublicBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.R2_PUBLIC_BASE_URL || "https://images.animesparks.blog").replace(/\/$/, "");
}
