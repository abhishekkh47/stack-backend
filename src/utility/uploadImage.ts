import Jimp from "jimp";
import aws from "aws-sdk";
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "us-west-2",
});
export const uploadImage = async (fileName, storagePath, req, res) => {
  let basePromise = [];
  await basePromise.push(
    new Promise(async (resolve, reject) => {
      const base64 = req.media;
      const extension = base64.split(";")[0].split("/")[1];
      const decodedImage = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const image = await Jimp.read(decodedImage);
      await image.quality(85);
      const operatedImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
      const params = {
        Bucket: "stack-users",
        Key: `${storagePath}/${fileName}`,
        Body: operatedImageBuffer,
        ContentEncoding: "base64",
        ContentType: extension,
      };
      await s3.putObject(params, function (perr, pres) {
        if (perr) {
          return reject(perr);
        } else {
          return resolve({
            code: 200,
            body: pres,
          });
        }
      });
    })
  );
  await Promise.all(basePromise).then(() => {
    return {
      code: 200,
    };
  });
};
