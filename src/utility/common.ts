import crypto from "crypto";

export const generateHash = (value: string) => {
  return crypto.createHash("md5").update(value).digest("hex");
};

export const getSharableLink = (hash: string) => {
  return `https://stack.com/redeem/${hash}`;
};
