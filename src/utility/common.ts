import config from "@app/config";
import crypto from "crypto";

export const generateHash = (value: string) => {
  return crypto.createHash("md5").update(value).digest("hex");
};

export const getSharableLink = (hash: string) => {
  return `${config.WEB_URL}/receiver-email/${hash}`;
};

export const getReactivateLink = (hash: string) => {
  return `${config.WEB_URL}/reactivate/${hash}`;
};

export const get72HoursAhead = (DateTime: any) => {
  const diff = new Date().valueOf() - new Date(DateTime).valueOf();
  return diff / 1000 / 60 / 60;
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
