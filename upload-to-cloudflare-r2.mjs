import fetch from 'node-fetch';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const token = process.env.CLOUDFLARE_R2_TOKEN;
const namespaceId = process.env.CLOUDFLARE_R2_NAMESPACE_ID;
const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
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
    const r2Path = `tainybot/${relative(buildDirectory, file)}`;

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(r2Path)}`,
        {
          method: 'PUT',
          body: fileContent,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
          },
        }
      );

      if (response.ok) {
        console.log(`File uploaded: ${r2Path}`);
      } else {
        console.error(`Failed to upload file: ${r2Path}`);
        console.error(await response.text());
      }
    } catch (error) {
      console.error(`Failed to upload file: ${r2Path}`, error);
    }
  }
}

(async () => {
  const files = walkSync(buildDirectory);
  await uploadFiles(files);
})();
