import axios from "axios";
import config from "../config/index";
import { PRIMETRUSTAPIS, PRIMETRUSTCONSTANT } from "./constants";

/**
 * @description This api is used by prime trust for getting jwt token to access all apis
 */
export const getPrimeTrustJWTToken = async () => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.jwt,
      {},
      {
        auth: {
          username: PRIMETRUSTCONSTANT.email,
          password: PRIMETRUSTCONSTANT.password,
        },
      }
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data.token,
      };
    })
    .catch((error) => {
      if (error) {
        return {
          status: error.response.status,
          message: "Unauthorized",
        };
      }
    });
  return response;
};

/**
 * @description This api is used to get user details from prime trust jwt token
 * @param token
 */
export const getUser = async (token) => {
  const response = await axios
    .get(config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.getUser, {
      headers: { Authorization: `Bearer ${token}` },
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
          message: "Unauthorized",
        };
      }
    });
  return response;
};

/**
 * @description This api is used by create parent child account in prime trust
 * @param token
 * @param data
 */
export const createAccount = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.accountCreate,
      { data: data },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      console.log(error.response.data, "error");
      return {
        status: 400,
        message: error.response.data,
      };
    });
  return response;
};

/**
 * @description This api is used to upload identity files for kyc related account.
 * @param token
 * @param data
 */
export const uploadFiles = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.uploadFiles,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...data.getHeaders(),

          // "Content-Type": "multipart/form-data",
        },
      }
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      console.log(error.response.data, "error");
      return {
        status: 400,
        message: error.response.data,
      };
    });
  return response;
};
