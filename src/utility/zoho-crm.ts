import config from "../config";
import axios from "axios";
import { PLAIDAPIS, ZOHOAPIS } from "./constants";
import request from "request";

/**
 * @description This api is used to get access token for zoho crm
 * @expiry 1hour expiry time
 */
export const getAccessToken = async (refreshToken) => {
  console.log(config.ZOHO_CLIENTID, "url");

  const response = await axios
    .post(
      `${config.ZOHO_ACCOUNTURL + ZOHOAPIS.getAccessToken}?client_id=${
        config.ZOHO_CLIENTID
      }&client_secret=${
        config.ZOHO_SECRETID
      }&grant_type=refresh_token&refresh_token=${refreshToken}`
    )
    .then((res) => {
      console.log(res.data);
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      console.log(error, "error");
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data.error_message,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get add account info in zoho crm
 */
export const addAccountInfoInZohoCrm = async (accessToken, data) => {
  console.log(data, "data");
  const response = await axios
    .post(config.ZOHO_DOMAIN + ZOHOAPIS.accountUpsert, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      console.log(res.data.data[0].details, "res");
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      console.log(error, "error");
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data,
        };
      }
    });
  return response;
};
