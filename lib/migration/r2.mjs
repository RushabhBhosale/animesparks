import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export function getR2Config(env = process.env, explicitBucket) {
  const required = [
    "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_S3_ENDPOINT", "R2_REGION",
  ];
  const missing = required.filter((key) => !env[key]?.trim());
  const bucket = (explicitBucket ?? env.R2_BUCKET_NAME)?.trim();
  if (!bucket) missing.push("R2_BUCKET_NAME or explicit --bucket");
  if (missing.length) throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  return {
    region: env.R2_REGION.trim(),
    endpoint: env.R2_S3_ENDPOINT.trim(),
    bucket,
    publicBaseUrl: (env.R2_PUBLIC_BASE_URL ?? "").trim().replace(/\/$/, ""),
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID.trim(),
      secretAccessKey: env.R2_SECRET_ACCESS_KEY.trim(),
    },
  };
}

export function createR2Client(config) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
    forcePathStyle: false,
  });
}

export async function uploadAsset(s3, config, asset) {
  await s3.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: asset.r2Key,
    Body: createReadStream(asset.localPath),
    ContentLength: asset.byteSize,
    ContentType: asset.mimeType,
    Metadata: { sha1: asset.sha1, sanityid: asset.sanityId },
  }));
  const head = await s3.send(new HeadObjectCommand({ Bucket: config.bucket, Key: asset.r2Key }));
  if (head.ContentLength !== asset.byteSize) {
    throw new Error(`R2 byte-size verification failed for ${asset.r2Key}: expected ${asset.byteSize}, got ${head.ContentLength}`);
  }
  if (head.Metadata?.sha1 !== asset.sha1 || head.Metadata?.sanityid !== asset.sanityId) {
    throw new Error(`R2 metadata verification failed for ${asset.r2Key}`);
  }
  return {
    ...asset,
    publicUrl: config.publicBaseUrl ? `${config.publicBaseUrl}/${asset.r2Key}` : null,
    r2VerifiedAt: new Date().toISOString(),
  };
}

export async function verifyAssetObject(s3, config, asset) {
  const head = await s3.send(new HeadObjectCommand({ Bucket: config.bucket, Key: asset.r2Key }));
  if (head.ContentLength !== asset.byteSize || head.Metadata?.sha1 !== asset.sha1 || head.Metadata?.sanityid !== asset.sanityId) {
    throw new Error(`R2 object verification failed for ${asset.r2Key}`);
  }
  const object = await s3.send(new GetObjectCommand({ Bucket: config.bucket, Key: asset.r2Key }));
  if (!object.Body) throw new Error(`R2 object body is missing for ${asset.r2Key}`);
  const hash = createHash("sha1");
  let byteSize = 0;
  for await (const chunk of object.Body) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    hash.update(buffer);
    byteSize += buffer.byteLength;
  }
  const actualSha1 = hash.digest("hex");
  if (byteSize !== asset.byteSize || actualSha1 !== asset.sha1) {
    throw new Error(`R2 content hash or byte-size verification failed for ${asset.r2Key}`);
  }
  return true;
}

export async function listBucketObjects(s3, bucket, prefix = "") {
  let continuationToken;
  const objects = [];
  do {
    const page = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));
    for (const object of page.Contents ?? []) {
      objects.push({ key: object.Key, size: object.Size ?? 0 });
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return {
    count: objects.length,
    totalBytes: objects.reduce((sum, object) => sum + object.size, 0),
    objects,
  };
}
