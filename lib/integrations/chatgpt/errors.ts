export class IntegrationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationConfigurationError";
  }
}

export class IntegrationCmsError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "IntegrationCmsError";
  }
}

export class InternalLinkValidationError extends Error {
  constructor(public readonly invalidUrls: string[]) {
    super("One or more internal links do not point to an existing published AnimeSparks article.");
    this.name = "InternalLinkValidationError";
  }
}

export class DraftNotFoundError extends Error {
  constructor() {
    super("Draft not found.");
    this.name = "DraftNotFoundError";
  }
}

export class PublishedPostNotFoundError extends Error {
  constructor() {
    super("Published blog post not found.");
    this.name = "PublishedPostNotFoundError";
  }
}

export class AlreadyPublishedError extends Error {
  constructor(public readonly post: StoredPublishedPost) {
    super("This article is already published.");
    this.name = "AlreadyPublishedError";
  }
}

export interface StoredPublishedPost {
  id: string;
  title: string;
  slug: string;
  publishedAt?: string;
}
