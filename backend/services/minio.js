const Minio = require("minio");

let client;
const bucket = () => process.env.MINIO_BUCKET?.trim() || "amrdiy-course-media";

const connectionOptions = () => {
  const configuredEndpoint = process.env.MINIO_ENDPOINT?.trim() || "127.0.0.1";
  // Accept either a hostname or a full endpoint such as https://minio.amrdiy.com.
  // The MinIO SDK expects the protocol separately from the hostname.
  const endpoint = configuredEndpoint.replace(/^https:\/(?!\/)/i, "https://");
  const hasProtocol = /^https?:\/\//i.test(endpoint);
  const url = hasProtocol ? new URL(endpoint) : null;
  const useSSL = url ? url.protocol === "https:" : process.env.MINIO_USE_SSL === "true";
  const port = url?.port
    ? Number(url.port)
    : Number(process.env.MINIO_PORT || (useSSL ? 443 : 9000));

  return {
    endPoint: url ? url.hostname : endpoint.replace(/\/$/, ""),
    port,
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY?.trim(),
    secretKey: process.env.MINIO_SECRET_KEY?.trim(),
  };
};

const getClient = () => {
  if (!client) {
    client = new Minio.Client(connectionOptions());
  }
  return client;
};

const ensureBucket = async () => {
  const storage = getClient();
  const name = bucket();
  if (!await storage.bucketExists(name)) await storage.makeBucket(name, "us-east-1");
  return name;
};

const uploadCourseVideo = async ({ path, objectName, size, contentType }) => {
  const name = await ensureBucket();
  await getClient().fPutObject(name, objectName, path, { "Content-Type": contentType, "X-Amz-Meta-Original-Size": String(size) });
  return { objectName, size, contentType };
};

const removeCourseVideo = async (objectName) => {
  if (objectName) await getClient().removeObject(bucket(), objectName);
};

const streamCourseVideo = async (objectName, range) => {
  const storage = getClient();
  const stat = await storage.statObject(bucket(), objectName);
  if (!range) return { stream: await storage.getObject(bucket(), objectName), stat, status: 200 };
  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) return { stream: await storage.getObject(bucket(), objectName), stat, status: 200 };
  const start = Number(match[1]);
  if (start >= stat.size) {
    const error = new Error("Requested range is not satisfiable");
    error.code = "RangeNotSatisfiable";
    throw error;
  }
  const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
  const length = end - start + 1;
  return { stream: await storage.getPartialObject(bucket(), objectName, start, length), stat, status: 206, start, end, length };
};

module.exports = { removeCourseVideo, streamCourseVideo, uploadCourseVideo };
