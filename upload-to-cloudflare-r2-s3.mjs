import AWS from 'aws-sdk';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const s3 = new AWS.S3({
  endpoint: 'https://625ef4db30d8f18f263989f279265ef1.r2.cloudflarestorage.com',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
});

// Set the bucket name and local directory containing the build artifacts
const bucketName = 'tainybot';
const buildDirectory = 'release';

function walkSync(dir, fileList = []) {
  readdirSync(dir).forEach((file) => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      fileList = walkSync(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

async function uploadFiles(files) {
  for (const file of files) {
    const fileContent = readFileSync(file);
    const s3Path = `updates/${relative(buildDirectory, file)}`;

    const params = {
      Bucket: bucketName,
      Key: s3Path,
      Body: fileContent,
      ACL: 'public-read',
    };

    try {
      await s3.upload(params).promise();
      console.log(`File uploaded: ${s3Path}`);
    } catch (error) {
      console.error(`Failed to upload file: ${s3Path}`, error);
    }
  }
}

(async () => {
  const files = walkSync(buildDirectory);
  await uploadFiles(files);
})();