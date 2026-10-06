const IMAGE_FILENAME = /(?:^|\/)([a-f\d]{40})-(.+)\.([^.]+)$/i;
const IMAGE_ASSET_ID = /^image-([a-f\d]{40})-/i;

function parsedExportReference(reference) {
  if (typeof reference !== "string") return null;
  let filename = reference;
  try { filename = decodeURIComponent(reference); } catch {}
  const match = filename.match(IMAGE_FILENAME);
  if (!match) return null;
  const [, sha1, dimensions, format] = match;
  return { sha1: sha1.toLowerCase(), assetId: `image-${sha1.toLowerCase()}-${dimensions}-${format.toLowerCase()}` };
}

function sha1FromAssetId(id) {
  return typeof id === "string" ? id.match(IMAGE_ASSET_ID)?.[1]?.toLowerCase() ?? null : null;
}

// Sanity's live API returns image.asset as a reference, while the export used
// for migration stores the same reference in _sanityAsset as a local filename.
// Normalize only that transport difference; retain every other Portable Text
// field (including keys, marks, markDefs, and image metadata) for strict checks.
export function normalizePortableTextAssets(value) {
  if (Array.isArray(value)) return value.map(normalizePortableTextAssets);
  if (!value || typeof value !== "object") return value;

  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (key !== "_sanityAsset") result[key] = normalizePortableTextAssets(child);
  }

  if (typeof value._sanityAsset === "string") {
    const reference = parsedExportReference(value._sanityAsset);
    result.asset = reference
      ? { _type: "reference", _ref: reference.assetId }
      : { _type: "reference", _ref: `unparsed:${value._sanityAsset}` };
  } else if (value._type === "image" && typeof value.asset?._ref === "string") {
    // Keep the complete Sanity asset ID: hash, dimensions, and format all
    // remain part of the equality check when both sides expose an ID.
    if (sha1FromAssetId(value.asset._ref)) result.asset = { ...value.asset };
  }
  return result;
}

// Stable serialization preserves the difference between null, missing, and
// explicit undefined properties while ignoring object insertion order.
export function canonical(value) {
  if (value === undefined) return '["$undefined"]';
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function concise(value) {
  if (value === undefined) return "<undefined>";
  if (value === null || typeof value !== "object") return value;
  const json = JSON.stringify(value);
  return json.length > 180 ? `${json.slice(0, 177)}...` : value;
}

export function structuralDiff(left, right, { limit = 12 } = {}) {
  const changes = [];
  const visit = (a, b, path) => {
    if (changes.length >= limit || canonical(a) === canonical(b)) return;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) changes.push({ path: `${path}.length`, sanity: a.length, mongodb: b.length });
      for (let i = 0; i < Math.max(a.length, b.length) && changes.length < limit; i += 1) {
        if (i >= a.length || i >= b.length) changes.push({ path: `${path}[${i}]`, sanity: i < a.length ? concise(a[i]) : "<missing>", mongodb: i < b.length ? concise(b[i]) : "<missing>" });
        else visit(a[i], b[i], `${path}[${i}]`);
      }
      return;
    }
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
      for (const key of keys) {
        if (changes.length >= limit) break;
        const childPath = path ? `${path}.${key}` : key;
        const hasA = Object.hasOwn(a, key), hasB = Object.hasOwn(b, key);
        if (!hasA || !hasB) {
          changes.push({ path: childPath, sanity: hasA ? concise(a[key]) : "<missing>", mongodb: hasB ? concise(b[key]) : "<missing>" });
        } else visit(a[key], b[key], childPath);
      }
      return;
    }
    changes.push({ path, sanity: concise(a), mongodb: concise(b) });
  };
  visit(left, right, "body");
  return changes;
}

export function findImageAssetReferences(value, out = []) {
  if (Array.isArray(value)) value.forEach((item) => findImageAssetReferences(item, out));
  else if (value && typeof value === "object") {
    if (typeof value._sanityAsset === "string") {
      const reference = parsedExportReference(value._sanityAsset);
      out.push({ exportReference: value._sanityAsset, assetId: reference?.assetId ?? null, sha1: reference?.sha1 ?? null });
    }
    else if (value._type === "image" && typeof value.asset?._ref === "string") out.push({ assetId: value.asset._ref, sha1: sha1FromAssetId(value.asset._ref) });
    Object.values(value).forEach((item) => findImageAssetReferences(item, out));
  }
  return out;
}
