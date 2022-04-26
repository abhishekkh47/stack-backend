import multer from "@koa/multer";
import path from "path";
import { verifyToken, checkValidImageExtension } from ".";

export const uploadIdProof = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../uploads"));
    },
    filename: function (req, file, cb) {
      let type = file.originalname.split(".")[1];
      cb(null, `${file.fieldname}-${Date.now().toString(16)}.${type}`);
    },
  }),
  limits: {
    fileSize: 5000000, // 1000000 Bytes = 1 MB
  },
  fileFilter(req, file, cb) {
    if (!checkValidImageExtension(file)) {
      return cb(
        new Error(
          "Please upload a Image of valid extension of jpg or pdf format only."
        )
      );
    }
    cb(null, true);
  },
});

export const uploadProfilePicture = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public"));
    },
    filename: async function (req, file, cb) {
      cb(
        null,
        `${(await verifyToken(req.rawHeaders[1]))._id}.${
          file.originalname.split(".")[1]
        }`
      );
    },
  }),
  limit: {
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    if (!checkValidImageExtension(file, "profile")) {
      return cb(
        new Error(
          "Please upload a Image of valid extension of jpg or pdf format only."
        )
      );
    }
    cb(null, true);
  },
});
