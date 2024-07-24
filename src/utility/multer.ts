import multer from "@koa/multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import path from "path";
import { verifyToken, checkValidImageExtension, IPromptData } from ".";
import fs from "fs";
import { NetworkError } from "@app/middleware";
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

const retryUpload = async (fn, retries = 3, delay = 1500) => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      if (attempts == 0) {
        throw new Error("First try");
      }
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= retries) throw error;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export const uploadCompanyLogo = multer({
  storage: multerS3({
    s3,
    bucket: "stack-business-information/companyLogo",
    key: async (req, file, cb) => {
      try {
        const generateKey = async () => {
          const response = await verifyToken(req.headers["x-access-token"]);
          if (response && response.status && response.status === 401) {
            throw new NetworkError("Unauthorised User", 401);
          }
          return `${response._id}/${file.fieldname}_${Date.now().toString()}.${
            file.originalname.split(".")[1]
          }`;
        };
        const key = await retryUpload(generateKey, 3, 1500);
        cb(null, key);
      } catch (error) {
        cb(error);
      }
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

export const uploadHomeScreenImage = multer({
  storage: multerS3({
    s3,
    bucket: `stack-business-information/homescreenImage`,
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

export const uploadSocialFeedback = multer({
  storage: multerS3({
    s3,
    bucket: `stack-business-information/socialFeedback`,
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

export const uploadMvpHomeScreen = multer({
  storage: multerS3({
    s3,
    bucket: `stack-business-information/mvpHomeScreen`,
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
export const uploadQuizImages = (prompt: IPromptData, outputPath: any) => {
  const fileContent = fs.readFileSync(outputPath);

  const params = {
    Bucket: "stack-images/quiz_images",
    Key: `${prompt.imageName}.webp`,
    Body: fileContent,
  };

  s3.upload(params, function (err, data) {
    if (err) {
      throw err;
    }
    return {
      response_code: 200,
      response_message: "Success",
      response_data: data,
    };
  });
};

export const checkQuizImageExists = async (
  prompt: IPromptData
): Promise<boolean> => {
  const params = {
    Bucket: "stack-images/quiz_images",
    Key: `${prompt.imageName}.webp`,
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (err) {
    if (err.name === "NotFound") {
      return false;
    }
    throw err;
  }
};
