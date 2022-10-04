import { EUserType } from './../types/user';
import { UserBanksTable } from './../model/user-banks';
import axios from "axios";
import config from "../config";
import { ALPACAAPI } from "../utility/constants";
import { EAccountStatus } from '@app/types';

/**
 * @description This api is used to get all the asset crypto
 */
 export const getAssetCrypto = async () => {
  const headers: any = {
    auth : {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
   }
    
  };
  const response = await axios
    .get(`${config.ALPACA_HOST}${ALPACAAPI.getAssetCrypto}`, 
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
          message: error.response.data.error_message,
          error_code: error.response.data.error_code,
        };
      }
    });
  return response;
};


/**
 * @description This api is used to add bank
 * @param processorToken
 * @param accountId
 * @returns {*}
 */
 export const addBankAccount = async (
  processToken: string,
  accountId: string
) => {
  const headers: any = {
    auth : {
      username: config.ALPACA_API_KEY,
      password: config.ALPACA_API_SECRET,
    }   
  };
  const response = await axios
    .post(config.ALPACA_HOST + ALPACAAPI.addBank(accountId), {"processor_token": processToken}, headers)
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
      accessToken: accessToken,
      status: bankDetails?.data?.status === 'QUEUED' ? EAccountStatus.QUEUED : 0,
      isDefault: 1,
      insId: institutionId,
    })
  
   return response;
 };

/**
 * @description This api is used to add bank data to userbank table
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
      auth : {
        username: config.ALPACA_API_KEY,
        password: config.ALPACA_API_SECRET,
     }
    };

    const body = {
      "transfer_type": "ach",
      "relationship_id": bankDetails.data.id,
      "amount": amount,
      "direction": "INCOMING"
    }
    const response = await axios
    .post(config.ALPACA_HOST + ALPACAAPI.depositAmount(accountId), body, headers)
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
 * @description This api is used to add bank data to userbank table
 * @param bankDetails
 * @param amount
 * @returns {*}
 */
  export const journalAmount = async (
    accountId: any
    ) => {
      const headers: any = {
        auth : {
          username: config.ALPACA_API_KEY,
          password: config.ALPACA_API_SECRET,
       }
      };
  
      const body = {
        "from_account": "59ca4c25-6c77-4d4a-b432-f9cf5dda960a", //ADMIN ACCOUNT ID
        "amount": 5,
        "to_account": accountId,
        "entry_type": "JNLC",
        "description": "test text"
      }
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
            message: error.response.data.error_message,
          };
        }
      });
      
      return response;
     
   };
  