import config from "../config";
import axios from "axios";
import { ZOHOAPIS } from "./constants";

/**
 * @description This api is used to get access token for zoho crm
 * @expiry 1hour expiry time
 */
export const getAccessToken = async (refreshToken) => {
  const response = await axios
    .post(
      `${config.ZOHO_ACCOUNTURL + ZOHOAPIS.getAccessToken}?client_id=${
        config.ZOHO_CLIENTID
      }&client_secret=${
        config.ZOHO_SECRETID
      }&grant_type=refresh_token&refresh_token=${refreshToken}`
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
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
  const url =
    config.APP_ENVIRONMENT == "STAGING"
      ? config.ZOHO_STAGING_DOMAIN
      : config.ZOHO_DOMAIN;
  const response = await axios
    .post(url + ZOHOAPIS.accountUpsert, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get account information
 */
export const getAccountInfo = async (accessToken) => {
  const url =
    config.APP_ENVIRONMENT == "STAGING"
      ? config.ZOHO_STAGING_DOMAIN
      : config.ZOHO_DOMAIN;
  const response = await axios
    .get(url + ZOHOAPIS.getAccounts, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get update information
 */
export const updateAccountInfoInZohoCrm = async (accessToken, id, data) => {
  try {
    const url =
      config.APP_ENVIRONMENT == "STAGING"
        ? config.ZOHO_STAGING_DOMAIN
        : config.ZOHO_DOMAIN;
    const response = await axios.put(
      url + ZOHOAPIS.updateAccountInfo(id),
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (response) {
      return {
        status: 200,
        data: response.data,
      };
    }
  } catch (error) {
    if (error) {
      return {
        status: error.response.status,
        message: error.response.data,
      };
    }
  }
};

/**
 * @description This api is used to search account information
 */
export const searchAccountInfo = async (accessToken, phone) => {
  const url =
    config.APP_ENVIRONMENT == "STAGING"
      ? config.ZOHO_STAGING_DOMAIN
      : config.ZOHO_DOMAIN;
  const response = await axios
    .get(url + ZOHOAPIS.searchAccounts(phone), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to search account information by email
 * @param accessToken
 * @param email
 */
export const searchAccountInfoByEmail = async (accessToken, email) => {
  const url =
    config.APP_ENVIRONMENT == "STAGING"
      ? config.ZOHO_STAGING_DOMAIN
      : config.ZOHO_DOMAIN;
  const response = await axios
    .get(url + ZOHOAPIS.searchAccountsByEmail(email), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to delete account information in zoho crm
 * @param accessToken
 * @param email
 */
export const deleteAccountInformationInZoho = async (accessToken, id) => {
  const url =
    config.APP_ENVIRONMENT == "STAGING"
      ? config.ZOHO_STAGING_DOMAIN
      : config.ZOHO_DOMAIN;
  const response = await axios
    .delete(url + ZOHOAPIS.deleteAccounts(id), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: error.response.data,
        };
      }
    });
  return response;
};
