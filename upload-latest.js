const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'release');
const packageJson = require('./package.json');
const appVersion = packageJson.version;
const platform = 'win';
const s3Bucket = 'tainybot';
const s3Folder = ''; // Leave it empty if you want to upload to the root of the bucket

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT, // Set your custom S3-compatible provider endpoint
    s3ForcePathStyle: true, // Set it to true if you are using a custom S3-compatible provider
});

const uploadToS3 = async (inputFile, key) => {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(inputFile);
        fileStream.on('error', (err) => {
            console.error('File Error:', err);
            reject(err);
        });

        const params = {
            Bucket: s3Bucket,
            Key: key,
            Body: fileStream,
        };

        s3.upload(params, (err, data) => {
            if (err) {
                console.error('Upload Error:', err);
                reject(err);
            } else {
                console.log('Upload Success:', data.Location);
                resolve(data.Location);
            }
        });
    });
};

// release/latest.zip
(async () => {
    // get channel from version version-dev
    const channel = appVersion.split('-')[1];

    const inputFile = path.join(distPath, appVersion, `tainybot_${appVersion}.${platform === 'win' ? 'exe' : 'AppImage'}`);
    const s3Key = path.join(s3Folder, 'latest' + (channel ? `-${channel}`: '') + (platform === 'win' ? '.exe' : '.AppImage'));
    await uploadToS3(inputFile, s3Key);

    // upload release/latest.zip 
    const inputFile2 = path.join(distPath, 'latest.zip');
    const s3Key2 = path.join(s3Folder, 'latest'  + (channel ? `-${channel}`: '') + '.zip');
    await uploadToS3(inputFile2, s3Key2);

})().catch((error) => console.error('Error:', error));
