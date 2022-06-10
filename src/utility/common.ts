import config from "../config";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { UserTable } from "../model";
export const generateHash = (value: string) => {
  return crypto.createHash("md5").update(value).digest("hex");
};

export const getSharableLink = (hash: string) => {
  return `${config.WEB_URL}/receiver-email/${hash}`;
};

export const getReactivateLink = (hash: string) => {
  return `${config.WEB_URL}/reactivate/${hash}`;
};

export const generateRandom6DigitCode = (isLive) => {
  return isLive ? Math.floor(100000 + Math.random() * 900000) : 123456;
};

export const generateTempPassword = (username) => {
  return `STACK_${username}_${(Math.random() + 1).toString(36).substring(7)}`;
};

export const get72HoursAhead = (DateTime: any) => {
  const diff = new Date().valueOf() - new Date(DateTime).valueOf();
  return diff / 1000 / 60 / 60;
};

export const getMinutesBetweenDates = (startDate, endDate) => {
  const diff = endDate.getTime() - startDate.getTime();
  return diff / 60000;
};

/**
 * @description This function use for create validation unique key
 * @param apiTag
 * @param error
 * @returns {*}
 */
export const validationMessageKey = (apiTag: string, error: any) => {
  let key = toUpperCase(error.details[0].context.key);
  let type = error.details[0].type.split(".");
  type = toUpperCase(type[1]);
  key = apiTag + key + type;
  return key;
};

export const toUpperCase = (str) => {
  if (str.length > 0) {
    const newStr = str
      .toLowerCase()
      .replace(/_([a-z])/, (m) => m.toUpperCase())
      .replace(/_/, "");
    return str.charAt(0).toUpperCase() + newStr.slice(1);
  }
  return "";
};
export const hashString = (length = 10) => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  result += bcrypt.hashSync(result, 10);
  return result;
};
export const checkValidImageExtension = (file) => {
  let fileArray = ["image/jpeg", "image/jpg", "application/pdf"];
  if (file.fieldname === "profile_picture")
    fileArray = ["image/jpeg", "image/jpg", "image/png"];
  if (file && fileArray.includes(file.mimetype)) return true;
  return false;
};

export const checkValidBase64String = (text) => {
  let match = text.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!match || match.length !== 3) {
    return false;
  }
  return true;
};

export const makeUniqueReferalCode = async (length = 7) => {
  let flag = true;
  let result = "";
  do {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i += 1) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    const checkReferralCodeExists = await UserTable.findOne({
      referralCode: result,
    });
    if (!checkReferralCodeExists) {
      flag = false;
    } else {
      result = "";
    }
  } while (flag);
  return result;
};
