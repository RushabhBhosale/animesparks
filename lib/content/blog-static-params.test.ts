import { describe, expect, it } from "vitest";
import { getInitialBlogStaticParams } from "./blog-static-params";

describe("on-demand article route generation", () => {
  it("does not enumerate article slugs during the build", () => {
    expect(getInitialBlogStaticParams()).toEqual([]);
  });
});
