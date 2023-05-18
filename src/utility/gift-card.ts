import { Config } from "aws-sdk";
import axios from "axios";
import config from "@app/config";
import { GIFTCARDAPIS, GIFTCARDS } from "./constants";

/**
 * @description This api is used to get the gift cards
 * @param token
 * @param data
 * @returns {*}
 */
export const getAllGiftCards = async (
  page: number,
  limit: number,
  giftCardResponse: any = []
) => {
  /**
   * used to get all the gift cards using api secret and url
   */
  const response = await axios
    .get(config.GIFT_CARD_API + GIFTCARDAPIS.getAllGiftCards(page, limit), {
      headers: {
        "X-GIFT-CARD-PRO-SECRET": config.GIFT_CARD_API_SECRET,
        "X-GIFT-CARD-PRO-SHOP": config.GIFT_CARD_API_URL,
      },
    })
    .then(async (res) => {
      if (res.data.error) {
        return await getAllGiftCards(page, limit);
      }
      if (res.data.length > 0) {
        giftCardResponse.push(...res.data);
        let countResponse: any = await countGiftCards();

        if (
          countResponse.status === 200 &&
          parseInt(countResponse.data.count) > giftCardResponse.length
        ) {
          await getAllGiftCards(page + 1, GIFTCARDS.limit, giftCardResponse);
        }
      }

      return {
        status: 200,
        data: giftCardResponse,
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

/**
 * @description This api is used to get the count of gift cards
 * @param token
 * @param data
 * @returns {*}
 */
export const countGiftCards = async () => {
  /**
   * used to get all the gift cards using api secret and url
   */
  const response = await axios
    .get(config.GIFT_CARD_API + GIFTCARDAPIS.countGiftCards, {
      headers: {
        "X-GIFT-CARD-PRO-SECRET": config.GIFT_CARD_API_SECRET,
        "X-GIFT-CARD-PRO-SHOP": config.GIFT_CARD_API_URL,
      },
    })
    .then(async (res) => {
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
