import { Config } from "aws-sdk";
import axios from "axios";
import config from "../config/index";
import { GIFTCARDAPIS } from "./constants";

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
    .get(config.GIFT_CARD_API + GIFTCARDAPIS.getAllGiftCards, {
      headers: {
        "X-GIFT-CARD-PRO-SECRET": config.GIFT_CARD_API_SECRET,
        "X-GIFT-CARD-PRO-SHOP": config.GIFT_CARD_API_URL,
      },
    })
    .then(async (res) => {
      if (res.data.error) {
        return await getAllGiftCards();
      }
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      return {
        status: 400,
        message: error.message,
      };
    });
  return response;
};
