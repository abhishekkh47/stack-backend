import axios from "axios";
import config from "../config/index";
import request from "request";
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
 * @returns {*}
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
 * @returns {*}
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
 * @returns {*}
 */
export const uploadFiles = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.uploadFiles,
      { data: data },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data,
      };
    });
  return response;
};

/**
 * @description This api is used to upload files in request api for kyc related document.
 * @param token
 * @param data
 * @returns {*}
 */
export const uploadFilesFetch = async (token, data) => {
  const options = {
    method: "POST",
    url: config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.uploadFiles,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "multipart/form-data",
    },
    formData: data,
  };
  return new Promise((resolve, reject) => {
    const response = request(options, function (err, res, body) {
      if (err) {
        return reject({
          status: 400,
          message: err,
        });
      }
      return resolve({
        status: 200,
        message: JSON.parse(res.body),
      });
    });
  });
};

/**
 * @description This api is used to agreement preview signed
 * @param token
 * @param data
 * @returns {*}
 */
export const agreementPreviews = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.agreementPreviews,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to do kyc document checks
 * @param token
 * @param data
 * @returns {*}
 */
export const kycDocumentChecks = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.kycDocumentChecks,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to do create fund transfer method
 * @param token
 * @param data
 * @returns {*}
 */
export const createFundTransferMethod = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.createFundTransferMethod,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data,
      };
    });
  return response;
};

/**
 * @description This api is used to do contributions == deposits
 * @param token
 * @param data
 * @returns {*}
 */
export const createContributions = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.contributions,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to do disbursements == withdraws
 * @param token
 * @param data
 * @returns {*}
 */
export const createDisbursements = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.disbursements,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to create push transfer method
 * @param token
 * @param data
 * @returns {*}
 */
export const createPushTransferMethod = async (token, data) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.pushTransfer,
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to transfer wire inbound
 * @param token
 * @param data
 * @returns {*}
 */
export const wireInboundMethod = async (token, data, id) => {
  const response = await axios
    .post(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.wireInbound(id),
      { data: data },
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to get assets with pagination
 * @param token
 * @param data
 * @returns {*}
 */
export const getAssets = async (token, page, number) => {
  const response = await axios
    .get(config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.getAssets(page, number), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to get the balance
 * @param token
 * @param id
 * @returns {*}
 */
export const getBalance = async (token, id) => {
  const response = await axios
    .get(config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.getBalance(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to generate a quote
 * @param token
 * @param data
 * @return {*}
 */
export const generateQuote = async (token, data) => {
  const response = await axios
    .post(config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.generateQuote(), data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
      };
    });
  return response;
};

/**
 * @description This api is used to execute a quote
 * @param token
 * @param data
 * @param id
 * @return {*}
 */
export const executeQuote = async (token, id, data) => {
  const response = await axios
    .post(config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.executeQuote(id), data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      return {
        status: 400,
        message: error.response.data,
      };
    });
  return response;
};

/**
 * @description This api is for wire transfer
 * @param token
 * @param accountId
 * @returns {*}
 */
export const getWireTransfer = async (token, accountId) => {
  const response = await axios
    .get(config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.getPushTransfer(accountId), {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.data)
    .catch((error) => {
      console.log(error, "error");
      return { status: 400, message: error.response.data };
    });
  return response;
};

/**
 * @description This api is to update prime trust data
 * @param token
 * @param accountId
 * @returns {*}
 */
export const updateContacts = async (token, contactId, data) => {
  const response = await axios
    .patch(
      config.PRIMETRUSTAPI_URL + PRIMETRUSTAPIS.updateContacts(contactId),
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    .then((res) => res.data)
    .catch((error) => {
      return { status: 400, message: error.response.data };
    });
  return response;
};
