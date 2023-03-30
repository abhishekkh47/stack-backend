import cron from "node-cron";
import config from "../../config";
import { priceHandler } from "./price";
import { historicalPriceHandler } from "./historical-price";
import { recurringDepositHandler } from "./recurring-deposit";
import { redeemGiftHandler } from "./redeem-gift";
import { challengeAvailableHandler } from "./quiz";
import { kycReminderHandler } from "./user";

const isUAT = config.APP_ENVIRONMENT === "UAT";

const JOBS = [
  {
    /**
     * Logic for getting crypto current price
     * Time:- at every 10 minutes
     */
    disabled: isUAT,
    expression: "*/10 * * * *",
    func: priceHandler,
  },
  {
    /**
     * Logic for getting crypto historical price
     * Time:- at 00:00 am every day
     */
    disabled: true,
    expression: "0 0 * * *",
    func: historicalPriceHandler,
  },
  {
    /**
     * Logic for recurring deposit if user has selected recurring deposit
     * Time:- at 00:00 am every day
     */
    disabled: isUAT,
    expression: "0 0 * * *",
    func: recurringDepositHandler,
  },
  {
    /**
     * Logic for redeeming gift card
     * Time: at every 15 mins
     */
    disabled: true,
    expression: "*/15 * * * *",
    func: redeemGiftHandler,
  },
  {
    /**
     * Logic for challenge available reminder
     * Time: at every 30 mins
     */
    disabled: false,
    expression: "*/30 * * * *",
    func: challengeAvailableHandler,
  },
  {
    /**
     * Logic for kyc reminder
     * Time: at every 30 mins
     */
    disabled: false,
    expression: "*/30 * * * *",
    func: kycReminderHandler,
  },
];

export const startCron = () => {
  JOBS.forEach((job) => {
    const { disabled, expression, func } = job;
    if (!disabled) {
      cron.schedule(expression, func);
    }
  });
};
