import { Config } from "aws-sdk";
import axios from "axios";
import config  from "../config/index";


/**
 * @description This api is used to get the gift cards
 * @param token
 * @param data
 * @returns {*}
 */
 export const getAllGiftCards = async () => {
  /**
   * used to get all the gift cards using api secret and url
   */
  const response = await axios
    .get(
      "https://giftcardpro.app/api/giftcards",
      {
        headers: {
        "X-GIFT-CARD-PRO-SECRET": "90a24764-5fce-43ac-97db-d16fdd23fd56",
        "X-GIFT-CARD-PRO-SHOP": "stack-gift-card.myshopify.com"
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
     console.log('error: ', error);
      return {
        status: 400,
        message: error.response.data.errors[0].detail,
        code: error.response.data.errors[0].code,
      };
    });
  return response;
};