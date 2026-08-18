const Minio = require("minio");

let client;
const bucket = () => process.env.MINIO_BUCKET?.trim() || "amrdiy-course-media";

const getClient = () => {
  if (!client) {
    client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT?.trim() || "127.0.0.1",
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY?.trim(),
      secretKey: process.env.MINIO_SECRET_KEY?.trim(),
    });
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
  const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
  const length = end - start + 1;
  return { stream: await storage.getPartialObject(bucket(), objectName, start, length), stat, status: 206, start, end, length };
};

module.exports = { removeCourseVideo, streamCourseVideo, uploadCourseVideo };
