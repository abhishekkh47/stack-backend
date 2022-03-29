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

export const get72HoursAhead = (DateTime : any) => {
  const diff = new Date().valueOf() - new Date(DateTime).valueOf();
  return diff / 1000 / 60 / 60;
}
