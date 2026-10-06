import { describe, expect, it } from "vitest";
import { canonical, findImageAssetReferences, normalizePortableTextAssets, structuralDiff } from "./parity.mjs";

const sha1 = "3a683b5c63f34f006f066e1f1bd4bd32c8267c03";

describe("parity helpers", () => {
  it("normalizes only the export filename versus Sanity image reference representation", () => {
    const sanity = [{ _key: "img1", _type: "image", alt: "Still", asset: { _type: "reference", _ref: `image-${sha1}-1920x1080-png` } }];
    const mongoSourceDocument = [{ _key: "img1", _type: "image", alt: "Still", _sanityAsset: `image@file://./images/${sha1}-1920x1080.png` }];

    expect(canonical(normalizePortableTextAssets(sanity))).toBe(canonical(normalizePortableTextAssets(mongoSourceDocument)));
    expect(normalizePortableTextAssets(mongoSourceDocument)[0]).toEqual({
      _key: "img1", _type: "image", alt: "Still", asset: { _type: "reference", _ref: `image-${sha1}-1920x1080-png` },
    });
  });

  it("still detects Portable Text loss and preserves mark, key, and missing versus null differences", () => {
    const sanity = [{ _key: "b1", _type: "block", markDefs: [], children: [{ _key: "s1", _type: "span", marks: ["strong"], text: "text" }] }];
    const mongo = [{ _key: "b1", _type: "block", markDefs: null, children: [{ _key: "s2", _type: "span", marks: [], text: "text" }] }];

    expect(canonical(sanity)).not.toBe(canonical(mongo));
    expect(structuralDiff(sanity, mongo)).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "body[0].children[0]._key" }),
      expect.objectContaining({ path: "body[0].children[0].marks[0]" }),
      expect.objectContaining({ path: "body[0].markDefs" }),
    ]));
    expect(canonical({ field: undefined })).not.toBe(canonical({}));
    expect(canonical({ field: null })).not.toBe(canonical({}));
  });

  it("counts both live Sanity and export-form image references", () => {
    const docs = [
      { _type: "image", asset: { _type: "reference", _ref: `image-${sha1}-1920x1080-png` } },
      { _type: "image", _sanityAsset: `image@file://./images/${sha1}-1920x1080.png` },
    ];
    expect(findImageAssetReferences(docs)).toEqual([
      { assetId: `image-${sha1}-1920x1080-png`, sha1 },
      { exportReference: `image@file://./images/${sha1}-1920x1080.png`, assetId: `image-${sha1}-1920x1080-png`, sha1 },
    ]);
  });
});
