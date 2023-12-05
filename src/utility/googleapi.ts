import axios from "axios";
import config from "@app/config";
import { GOOGLEAPIS, PLAIDAPIS } from "./constants";

/**
 * @description This api is used to search schools based on user input in google autocomplete api
 * @param userData
 * @returns {*}
 */
export const searchSchools = async (input: string) => {
  const types = `school|university`;
  const response = await axios
    .get(
      `${GOOGLEAPIS.placeApi}?key=${config.GOOGLE_PLACE_KEY}&input=${input}&language=en&components=country:us&types=${types}`
    )
    .then((res) => {
      return {
        status: 200,
        data: res.data,
      };
    })
    .catch((error) => {
      if (error) {
        return error;
      }
    });
  return response;
};
