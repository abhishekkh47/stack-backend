import multer from "@koa/multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import { verifyToken, checkValidImageExtension } from ".";

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "us-west-2",
});

export const uploadFileS3 = multer({
  storage: multerS3({
    s3,
    bucket: "stack-users",
    key: async (req, file, cb) => {
      cb(
        null,
        `${(await verifyToken(req.rawHeaders[1]))._id}/${
          file.fieldname
        }_${Date.now().toString()}.${file.originalname.split(".")[1]}`
      );
    },
  }),
  limit: { fileSize: 5000000 },
  fileFilter(req, file, cb) {
    if (!checkValidImageExtension(file))
      return cb(
        new Error(
          "Please upload a Image of valid extension of jpg or pdf format only."
        )
      );
    cb(null, true);
  },
});
