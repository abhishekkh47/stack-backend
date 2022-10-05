import axios from "axios";
import config from "../config";
import { PLAIDAPIS } from "./constants";

let request = {
  client_id: config.PLAID_CLIENT_ID,
  secret: config.PLAID_SECRET,
};

/**
 * @description This api is used to get link token for plaid integerations
 */
export const getLinkToken = async (userData, accessToken) => {
  const clientUserId = userData._id;
  let request: any = {
    client_id: config.PLAID_CLIENT_ID,
    secret: config.PLAID_SECRET,
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: clientUserId,
    },
    client_name: "Stack",
    products: accessToken ? [] : ["auth"],
    language: "en",
    country_codes: ["US"],
  };
  if (accessToken) {
    request = {
      ...request,
      update: { account_selection_enabled: true },
      access_token: accessToken,
    };
  }
  const response = await axios
    .post(config.PLAID_ENV + PLAIDAPIS.getLinkToken, request)
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
 * @description This api is used to exchange the public token to access token
 * @param userData
 * @returns {*}
 */
export const getPublicTokenExchange = async (publicToken: string) => {
  const request = {
    client_id: config.PLAID_CLIENT_ID,
    secret: config.PLAID_SECRET,
    public_token: publicToken,
  };
  const response = await axios
    .post(config.PLAID_ENV + PLAIDAPIS.publicTokenExchange, request)
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
 * @description This api is used to create processor token by access token
 * @param accessToken
 * @param accountId
 * @returns {*}
 */
export const createProcessorToken = async (
  accessToken: string,
  accountId: string
) => {
  const request = {
    client_id: config.PLAID_CLIENT_ID,
    secret: config.PLAID_SECRET,
    access_token: accessToken,
    account_id: accountId,
    processor: "alpaca",
  };
  const response = await axios
    .post(config.PLAID_ENV + PLAIDAPIS.createProcessorToken, request)
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
 * @description This api is used to get account by plaid
 * @param accessToken
 * @param accountId
 * @returns {*}
 */
export const getAccounts = async (accessToken: string) => {
  const request = {
    client_id: config.PLAID_CLIENT_ID,
    secret: config.PLAID_SECRET,
    access_token: accessToken,
  };
  const response = await axios
    .post(config.PLAID_ENV + PLAIDAPIS.getAccounts, request)
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
          error_code: error.response.data.error_code,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get instituion by id
 * @param accessToken
 * @param accountId
 * @returns {*}
 */
export const institutionsGetByIdRequest = async (institutionId: string) => {
  const request = {
    client_id: config.PLAID_CLIENT_ID,
    secret: config.PLAID_SECRET,
    institution_id: institutionId,
    options: { include_optional_metadata: true },
    country_codes: ["US"],
  };
  const response = await axios
    .post(config.PLAID_ENV + PLAIDAPIS.institutionsGetById, request)
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
