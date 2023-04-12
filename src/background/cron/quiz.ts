import { AdminTable, QuizResult, UserTable } from "@app/model";
import moment from "moment";
import { NOTIFICATION, NOTIFICATION_KEYS } from "@app/utility/constants";
import { DeviceTokenService } from "@app/services/v1";
import quizDbService from "@app/services/v4/quiz.db.service";

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
        await DeviceTokenService.sendUserNotification(
          data._id,
          NOTIFICATION_KEYS.CHALLENGE_AVAILABLE,
          NOTIFICATION.CHALLENGE_AVAILABLE_TITLE,
          NOTIFICATION.CHALLENGE_AVAILABLE_MESSAGE,
          null,
          data._id
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
