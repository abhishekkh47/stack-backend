import multer from "@koa/multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import path from "path";
import { verifyToken, checkValidImageExtension } from ".";
import fs from "fs";
import { NetworkError } from "../middleware/error.middleware";
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
      const response = await verifyToken(req.headers["x-access-token"]);
      if (response && response.status && response.status === 401) {
        return cb(new NetworkError("Unauthorised User", 401));
      }
      return cb(
        null,
        `${response._id}/${file.fieldname}_${Date.now().toString()}.${
          file.originalname.split(".")[1]
        }`
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
    return cb(null, true);
  },
});
export const uploadIdProof = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (!fs.existsSync(path.join(__dirname, "../../uploads")))
        fs.mkdirSync(path.join(__dirname, "../../uploads"));
      cb(null, path.join(__dirname, "../../uploads"));
    },
    filename: function (req, file, cb) {
      let type = file.originalname.split(".")[1];
      cb(null, `${file.fieldname}-${Date.now().toString(16)}.${type}`);
    },
  }),
  limits: {
    fileSize: 7000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!checkValidImageExtension(file)) {
      return cb(
        new Error(
          "Please upload a Image of valid extension of jpg, png, or pdf format only."
        )
      );
    }
    cb(null, true);
  },
});
export const removeImage = (userId: string, imageName: string) => {
  return s3.deleteObject(
    {
      Bucket: "stack-users",
      Key: `${userId}/${imageName}`,
    },
    (err, data) => {
      if (err) return false;
      return true;
    }
  );
};
