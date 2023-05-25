import { AdminTable, QuizResult, UserTable } from "@app/model";
import moment from "moment";
import { NOTIFICATIONS, NOTIFICATION_KEYS } from "@app/utility/constants";
import { DeviceTokenService } from "@app/services/v1";
import quizDbService from "@app/services/v4/quiz.db.service";
import { QuizDBService } from "@app/services/v4";

export const challengeAvailableHandler = async () => {
  console.log("==========Start Cron For Challenge Available=============");
  const currentTime = moment().unix();
  const admin = await AdminTable.findOne({});
  const hoursToAdd = admin.quizCooldown[1.9];
  const lastQuizResult: any = await quizDbService.getLastQuizRecord();
  let userIds = [];
  if (lastQuizResult.length === 0) return false;
  await Promise.all(
    lastQuizResult.map(async (data: any) => {
      let createdAt = moment(data.createdAt).add(hoursToAdd, "hours").unix();
      if (createdAt <= currentTime) {
        let isQuizRemaining = await QuizDBService.checkAllQuizPlayedByTeens(
          data._id
        );
        if (!isQuizRemaining) return false;
        const { key, title, message, nameForTracking } =
          NOTIFICATIONS.CHALLENGE_AVAILABLE;
        await DeviceTokenService.sendUserNotification(
          data._id,
          key,
          title,
          message,
          null,
          data._id,
          nameForTracking
        );
        userIds.push(data._id);
      }
      return true;
    })
  );
  await UserTable.updateMany(
    { _id: { $in: userIds } },
    {
      $set: {
        isQuizReminderNotificationSent: true,
      },
    }
  );
  return true;
};
