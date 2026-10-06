import { AsyncLocalStorage } from "node:async_hooks";

type DiagnosticContext = { slug: string };
const context = new AsyncLocalStorage<DiagnosticContext>();

function isEnabled(slug: string) {
  return process.env.NEXT_PHASE === "phase-production-build" &&
    process.env.ANIMESPARKS_DIAG_SLUG === slug;
}

function write(slug: string, stage: string, elapsedMs: number, extra: Record<string, unknown> = {}) {
  if (!isEnabled(slug)) return;
  console.info("[animesparks-static-diagnostic]", JSON.stringify({
    slug,
    stage,
    elapsedMs: Math.round(elapsedMs * 100) / 100,
    pid: process.pid,
    ...extra,
  }));
}

export function currentStaticArticleDiagnosticSlug() {
  const slug = context.getStore()?.slug;
  return slug && isEnabled(slug) ? slug : undefined;
}

export function withStaticArticleDiagnostic<T>(slug: string, run: () => Promise<T>) {
  if (!isEnabled(slug)) return run();
  return context.run({ slug }, run);
}

export async function timeStaticArticleStage<T>(stage: string, run: () => Promise<T>): Promise<T> {
  const slug = currentStaticArticleDiagnosticSlug();
  if (!slug) return run();
  const started = performance.now();
  write(slug, stage, 0, { event: "start" });
  try {
    const value = await run();
    write(slug, stage, performance.now() - started, { event: "end" });
    return value;
  } catch (error) {
    write(slug, stage, performance.now() - started, {
      error: error instanceof Error ? error.name : "unknown",
      event: "error",
    });
    throw error;
  }
}

export function timeStaticArticleStageSync<T>(stage: string, run: () => T): T {
  const slug = currentStaticArticleDiagnosticSlug();
  if (!slug) return run();
  const started = performance.now();
  write(slug, stage, 0, { event: "start" });
  try {
    const value = run();
    write(slug, stage, performance.now() - started, { event: "end" });
    return value;
  } catch (error) {
    write(slug, stage, performance.now() - started, {
      error: error instanceof Error ? error.name : "unknown",
      event: "error",
    });
    throw error;
  }
}

export function noteStaticArticleDiagnostic(stage: string, extra: Record<string, unknown> = {}) {
  const slug = currentStaticArticleDiagnosticSlug();
  if (slug) write(slug, stage, 0, extra);
}
