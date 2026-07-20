import { NextResponse } from "next/server";

import {
  IntegrationCmsError,
  IntegrationConfigurationError,
  InternalLinkValidationError,
} from "./errors";

export class RequestBodyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readLimitedJson(request: Request, maximumBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RequestBodyError("Request body is too large.", 413, "REQUEST_TOO_LARGE");
  }
  if (!request.body) throw new RequestBodyError("Request body must be valid JSON.", 400, "INVALID_JSON");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyError("Request body is too large.", 413, "REQUEST_TOO_LARGE");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestBodyError("Request body must be valid JSON.", 400, "INVALID_JSON");
  }
}

export function integrationJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export function commonIntegrationError(error: unknown): NextResponse | null {
  if (error instanceof RequestBodyError) {
    return integrationJson({ success: false, error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof InternalLinkValidationError) {
    return integrationJson(
      {
        success: false,
        error: error.message,
        code: "INVALID_INTERNAL_LINK",
        invalidUrls: error.invalidUrls,
      },
      { status: 400 },
    );
  }
  if (error instanceof IntegrationConfigurationError) {
    console.error("[chatgpt-integration] configuration error", JSON.stringify({ message: error.message }));
    return integrationJson(
      { success: false, error: "The integration is not configured.", code: "INTEGRATION_NOT_CONFIGURED" },
      { status: 503 },
    );
  }
  if (error instanceof IntegrationCmsError) {
    console.error("[chatgpt-integration] CMS operation failed", JSON.stringify({ message: error.message }));
    return integrationJson(
      { success: false, error: "The CMS operation could not be completed.", code: "CMS_OPERATION_FAILED" },
      { status: 502 },
    );
  }
  return null;
}
