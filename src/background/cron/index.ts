import { EJOBS } from "@app/types";
import cron from "node-cron";
import { scheduleJob } from "../agenda";

export const startCron = () => {
  cron.schedule("0 0 0 * * *", async () => {
    await scheduleJob("now", EJOBS.EXPIRE_GIFT_CARDS);
  });
};
