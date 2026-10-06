import { isDeepStrictEqual } from "node:util";

function idKey(document) {
  if (!Object.hasOwn(document, "_id")) throw new Error("A database document is missing its _id; refusing an inexact copy.");
  return document._id && typeof document._id.toHexString === "function"
    ? `objectId:${document._id.toHexString()}`
    : `${typeof document._id}:${String(document._id)}`;
}

export function planDocumentCopy(sourceDocs, targetDocs, collectionName) {
  const sourceById = new Map(sourceDocs.map((doc) => [idKey(doc), doc]));
  const targetById = new Map(targetDocs.map((doc) => [idKey(doc), doc]));
  if (sourceById.size !== sourceDocs.length || targetById.size !== targetDocs.length) {
    throw new Error(`Duplicate _id found in ${collectionName}; refusing to copy.`);
  }
  for (const [key, targetDoc] of targetById) {
    const sourceDoc = sourceById.get(key);
    if (!sourceDoc) throw new Error(`Destination ${collectionName} contains a document absent from staging; refusing to overwrite or delete destination data.`);
    if (!isDeepStrictEqual(targetDoc, sourceDoc)) throw new Error(`Destination ${collectionName} contains a conflicting document; refusing to overwrite destination data.`);
  }
  return sourceDocs.filter((doc) => !targetById.has(idKey(doc)));
}

export function assertDocumentMirror(sourceDocs, targetDocs, collectionName) {
  if (targetDocs.length !== sourceDocs.length) throw new Error(`Destination ${collectionName} does not exactly match the staging document count.`);
  const sourceById = new Map(sourceDocs.map((doc) => [idKey(doc), doc]));
  if (sourceById.size !== sourceDocs.length) throw new Error(`Duplicate _id found in staging ${collectionName}.`);
  for (const doc of targetDocs) {
    if (!isDeepStrictEqual(doc, sourceById.get(idKey(doc)))) {
      throw new Error(`Destination ${collectionName} document does not exactly match staging; sanityId=${doc.sanityId ?? "not-applicable"}.`);
    }
  }
}
