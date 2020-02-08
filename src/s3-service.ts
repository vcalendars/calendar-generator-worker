import { S3 } from 'aws-sdk';

const s3 = new S3({
  apiVersion: '2006-03-01',
});

export default {
  uploadToS3: async function(key: string, body: string) {
    await s3
      .putObject({
        Bucket: process.env.CALENDAR_S3_BUCKET || 'vcalendars-dev',
        Key: key,
        ContentType: 'text/calendar',
        Body: Buffer.from(body, 'binary'),
        ACL: 'public-read',
      })
      .promise();
  },
};
