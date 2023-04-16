import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (event) => {
  const {
    arguments: {
      input: { name, type, size },
    },
  } = event;

  const client = new S3Client({ region: "us-east-1" });

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: name,
    ContentType: type,
    ContentLength: size,
  });

  const url = await getSignedUrl(client, command);

  return {
    url,
    expiresIn: 60 * 60 * 24,
  };
};
