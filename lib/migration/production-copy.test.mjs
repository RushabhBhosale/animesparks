import { describe, expect, it } from "vitest";
import { assertDocumentMirror, planDocumentCopy } from "./production-copy.mjs";

const source = [
  { _id: "a", sanityId: "article-a", body: [{ _key: "x", children: ["one"] }] },
  { _id: "b", sanityId: "article-b", nested: { exact: true } },
];

describe("production database copy safety", () => {
  it("plans a dry-run as missing documents without mutating either input", () => {
    const destination = [{ ...source[0], body: [{ _key: "x", children: ["one"] }] }];
    const beforeSource = structuredClone(source);
    const beforeDestination = structuredClone(destination);

    expect(planDocumentCopy(source, destination, "articles")).toEqual([source[1]]);
    expect(source).toEqual(beforeSource);
    expect(destination).toEqual(beforeDestination);
  });

  it("is idempotent when the destination already mirrors source", () => {
    expect(planDocumentCopy(source, structuredClone(source), "articles")).toEqual([]);
    expect(() => assertDocumentMirror(source, structuredClone(source), "articles")).not.toThrow();
  });

  it("refuses conflicting or extra destination documents instead of overwriting them", () => {
    expect(() => planDocumentCopy(source, [{ ...source[0], sanityId: "changed" }], "articles"))
      .toThrow(/conflicting document/);
    expect(() => planDocumentCopy(source, [{ _id: "outside" }], "articles"))
      .toThrow(/absent from staging/);
  });

  it("detects a non-identical final mirror", () => {
    expect(() => assertDocumentMirror(source, [{ ...source[0] }, { ...source[1], nested: { exact: false } }], "articles"))
      .toThrow(/does not exactly match/);
  });
});
