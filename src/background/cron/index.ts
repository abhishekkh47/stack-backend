import cron from "node-cron";
import { rotateTokenHandler } from "./admin";
import { processPendingLogos } from "./saveLogo";

const JOBS = [
  {
    /**
     * Logic for rotating auth tokens from admin
     * Time: at 00:00 every day
     */
    disabled: false,
    expression: "0 0 * * *",
    func: rotateTokenHandler,
  },
  {
    /**
     * Logic for download and upload generated logos for the users who has not saved any logo
     * Time: at 00:00 and 12:00 every day
     */
    disabled: false,
    expression: "0 0 * * *",
    func: processPendingLogos,
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
