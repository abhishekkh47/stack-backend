import { AdminTable, QuizResult, UserTable } from "@app/model";
import moment from "moment";
import { NOTIFICATIONS, NOTIFICATION_KEYS } from "@app/utility/constants";
import { DeviceTokenServiceV4 } from "@app/services/v4";
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
        userIds.push(data._id);
      }
      return true;
    })
  );
  const { key, title, message, nameForTracking } =
    NOTIFICATIONS.CHALLENGE_AVAILABLE;
  await DeviceTokenServiceV4.sendUserNotificationForCron(
    userIds,
    key,
    title,
    message,
    null,
    userIds,
    nameForTracking
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
