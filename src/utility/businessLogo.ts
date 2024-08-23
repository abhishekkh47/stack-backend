import aws from "aws-sdk";
import { NetworkError } from "@app/middleware";
import axios from "axios";

const BUCKET_NAME = "stack-business-information/companyLogo";
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "us-west-2",
  endpoint: "https://s3.amazonaws.com",
  s3ForcePathStyle: true, // Use path-style URLs
});

const generatePresignedUrl = async (userId: string, key: string) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `${userId}/${key}`,
      Expires: 60, // URL expiry time in seconds
      ContentType: "image/webp",
    };

    return s3.getSignedUrlPromise("putObject", params);
  } catch (error) {
    throw new NetworkError(`generatePresignedUrl - ${error.message}`, 400);
  }
};

const fetchImage = async (imageUrl: string) => {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return response.data;
  } catch (error) {
    throw new NetworkError(`fetchImage - ${error.message}`, 400);
  }
};

const uploadToS3 = async (presignedUrl: any, imageBuffer: any) => {
  try {
    const response = await axios.put(presignedUrl, imageBuffer, {
      headers: {
        "Content-Type": "image/webp",
      },
    });

    if (response.status === 200) {
      return presignedUrl.split("?")[0];
    } else {
      throw new NetworkError(`Failed to upload image to S3`, 400);
    }
  } catch (error) {
    throw new NetworkError(
      `uploadToS3 - Failed to upload image to S3 ${error.message}`,
      400
    );
  }
};

const uploadImagesToS3Sequentially = async (presignedUrls, imageBuffers) => {
  const uploadResults = [];
  for (let i = 0; i < presignedUrls.length; i++) {
    const url = presignedUrls[i];
    const buffer = imageBuffers[i];
    try {
      const uploadedUrl = await uploadToS3(url, buffer);
      uploadResults.push(uploadedUrl);
    } catch (error) {
      throw new NetworkError(
        `uploadImagesToS3Sequentially - Error uploading image ${i} - ${error.message}`,
        400
      );
    }
  }
  return uploadResults;
};

export const processImages = async (
  userId: string,
  imageUrls: Array<string>
) => {
  try {
    const logoKeys = ["logo1.webp", "logo2.webp", "logo3.webp", "logo4.webp"];
    const presignedUrls = await Promise.all(
      logoKeys.map((key) => generatePresignedUrl(userId, key))
    );
    const imageBuffers = await Promise.all(imageUrls.map(fetchImage));
    const uploadResults = await uploadImagesToS3Sequentially(
      presignedUrls,
      imageBuffers
    );
    if (uploadResults.every((result) => result)) {
      console.log("All images uploaded successfully to S3");
    } else {
      console.log("Failed to upload some images to S3");
    }
    return uploadResults;
  } catch (error) {
    throw new NetworkError(error.message, 400);
  }
};
