export default function sharpUnavailableInWorkers() {
  throw new Error("Sharp image processing is unavailable in the Cloudflare Workers runtime.");
}
