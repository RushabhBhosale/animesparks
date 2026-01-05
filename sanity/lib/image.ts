import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

import { dataset, projectId } from "@/sanity/env";

const builder = createImageUrlBuilder({ projectId, dataset });

type ImageBuilder = ReturnType<typeof builder.image>;
type FitMode = Parameters<ImageBuilder["fit"]>[0];
type CropMode = Parameters<ImageBuilder["crop"]>[0];
type AutoMode = Parameters<ImageBuilder["auto"]>[0];

type ImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
  fit?: FitMode;
  crop?: CropMode;
  auto?: AutoMode;
};

const withDefaults = (imageBuilder: ImageBuilder) =>
  imageBuilder.quality(70).auto("format").fit("max");

export const urlFor = (source: SanityImageSource) => withDefaults(builder.image(source));

export const sanityImageUrl = (source: SanityImageSource, options: ImageOptions = {}) => {
  const { width, height, quality = 70, fit = "max", crop, auto = "format" } = options;

  let imageBuilder = builder.image(source).quality(quality).auto(auto).fit(fit);

  if (width) {
    imageBuilder = imageBuilder.width(width);
  }

  if (height) {
    imageBuilder = imageBuilder.height(height);
  }

  if (crop) {
    imageBuilder = imageBuilder.crop(crop);
  }

  return imageBuilder.url();
};

const HERO_MAX_WIDTH = 1400;
const HERO_QUALITY = 60;

export const sanityHeroImageUrl = (source: SanityImageSource, options: ImageOptions = {}) =>
  sanityImageUrl(source, {
    ...options,
    width: Math.min(options.width ?? HERO_MAX_WIDTH, HERO_MAX_WIDTH),
    quality: Math.min(options.quality ?? HERO_QUALITY, HERO_QUALITY),
    auto: options.auto ?? "format",
    fit: options.fit ?? "max",
  });
