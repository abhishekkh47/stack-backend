import config from "@app/config";
import axios from "axios";
import { PLAIDAPIS } from "./constants";

/**
 * @description This api is used to get link token for plaid integerations
 */
export const getLinkToken = async (userData) => {
  const clientUserId = userData._id;
  const request = {
    client_id: config.PLAID_CLIENT_ID,
    secret: config.PLAID_SECRET,
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: clientUserId,
    },
    client_name: userData.firstName + " " + userData.lastName,
    products: ["auth"],
    language: "en",
    country_codes: ["US"],
  };
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
