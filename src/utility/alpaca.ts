import { EUserType } from "./../types/user";
import { UserBanksTable } from "./../model/user-banks";
import axios from "axios";
import config from "../config";
import { ALPACAAPI } from "../utility/constants";
import { EBankStatus } from "@app/types";

/**
 * @description This api is used to get all the asset crypto
 */
export const getAssetCrypto = async () => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };
  const response = await axios
    .get(`${config.ALPACA_HOST}${ALPACAAPI.getAssetCrypto}`, headers)
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
          message: error.response.data.message,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to add bank to alpaca
 * @param processorToken
 * @param accountId
 * @returns {*}
 */
export const addBankAccount = async (
  processToken: string,
  accountId: string
) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };
  const response = await axios
    .post(
      config.ALPACA_HOST + ALPACAAPI.addBank(accountId),
      { processor_token: processToken },
      headers
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
          message: error.response.data.message,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to add bank data to userbank table
 * @param processToken
 * @param accessToken
 * @param userId
 * @param parentId
 * @param status
 * @param isDefault
 * @returns {*}
 */
export const createBank = async (
  bankDetails: any,
  processToken: string,
  accessToken: string,
  institutionId: string,
  userExists: any
) => {
  const response = await UserBanksTable.create({
    userId: userExists._id,
    parentId: userExists._id,
    processorToken: processToken,
    relationshipId: bankDetails.data.id,
    accessToken: accessToken,
    status: bankDetails?.data?.status === "QUEUED" ? EBankStatus.QUEUED : 0,
    isDefault: 1,
    insId: institutionId,
  });

  return response;
};

/**
 * @description THis api is used to deposit amount to user
 * @param bankDetails
 * @param amount
 * @returns {*}
 */
export const depositAmount = async (
  bankDetails: any,
  amount: number,
  accountId: any
) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };

  const body = {
    transfer_type: "ach",
    relationship_id: bankDetails?.data?.id
      ? bankDetails?.data?.id
      : bankDetails,
    amount: amount,
    direction: "INCOMING",
    timing: "immediate"
  };
  const response = await axios
    .post(
      config.ALPACA_HOST + ALPACAAPI.depositAmount(accountId),
      body,
      headers
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};

/**
 * @description THis api is used to deposit amount to user
 * @param bankDetails
 * @param amount
 * @returns {*}
 */
export const withdrawAmount = async (
  bankDetails: any,
  amount: number,
  accountId: any
) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };

  const body = {
    transfer_type: "ach",
    relationship_id: bankDetails?.data?.id
      ? bankDetails?.data?.id
      : bankDetails,
    amount: amount,
    direction: "OUTGOING",
    timing: "immediate"
  };
  const response = await axios
    .post(
      config.ALPACA_HOST + ALPACAAPI.depositAmount(accountId),
      body,
      headers
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};

/**
 * @description This api is used to transfer 5 USD from admin to user
 * @param bankDetails
 * @param amount
 * @returns {*}
 */
export const journalAmount = async (accountId: any) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };

  const body = {
    from_account: config.CLIENT_ALPACA_ACC_ID, //ADMIN ACCOUNT ID
    amount: 5,
    to_account: accountId,
    entry_type: "JNLC",
    description: "test text",
  };
  const response = await axios
    .post(config.ALPACA_HOST + ALPACAAPI.journalAmount, body, headers)
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};

/**
 * @description This api is used to get the ach relationship
 * @param bankDetails
 * @param amount
 * @returns {*}
 */
export const getAchRelationship = async (accountId: any) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };
  const response = await axios
    .get(config.ALPACA_HOST + ALPACAAPI.getAchRelationship(accountId), headers)
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};

/**
 * @description This api is used to get the balance
 * @param accountId
 * @returns {*}
 */
export const getBalanceAlpaca = async (accountId: any) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };
  const response = await axios
    .get(config.ALPACA_HOST + ALPACAAPI.getBalance(accountId), headers)
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};

/**
 * @description This api is used to buy crypto
 * @param accountId
 * @returns {*}
 */
export const buyCryptoAlpaca = async (accountId: any, reqParam) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };

  const body: any = {
    symbol: `${reqParam.symbol}/USD`,
    notional: reqParam.amount,
    side: reqParam.side,
    type: reqParam.type,
    time_in_force: reqParam.time,
  };
  const response = await axios
    .post(
      config.ALPACA_HOST + ALPACAAPI.buySellCrypto(accountId),
      body,
      headers
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};

/**
 * @description THis api is used to get market value of crypto
 * @param accountId
 * @param symbol_or_asset_id
 * @return {*}
 */
export const getMarketValue = async (accountId: string, symbol: string) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };

  const response = await axios
  .get(
    config.ALPACA_HOST + ALPACAAPI.getMarketValue(accountId, symbol),
    headers
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
          message: error.response.data.message,
        };
      }
    });
  return response;
};

/**
 * @description This api is used to sell crypto
 * @param accountId
 * @returns {*}
 */
export const sellCryptoAlpaca = async (accountId: any, reqParam, symbol) => {
  const headers: any = {
    auth: {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    },
  };

  const body: any = {
    symbol: `${symbol}/USD`,
    notional: reqParam.amount,
    side: reqParam.side,
    type: reqParam.type,
    time_in_force: reqParam.time,
  };
  const response = await axios
    .post(
      config.ALPACA_HOST + ALPACAAPI.buySellCrypto(accountId),
      body,
      headers
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
          message: error.response.data.message,
        };
      }
    });

  return response;
};
