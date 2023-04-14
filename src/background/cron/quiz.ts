import { AdminTable, UserTable } from "../../model";
import moment from "moment";
import { NOTIFICATIONS } from "../../utility/constants";
import { DeviceTokenService } from "../../services/v1";
import quizDbService from "../../services/v4/quiz.db.service";

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
        const { key, title, message, nameForTracking } = NOTIFICATIONS.CHALLENGE_AVAILABLE
        await DeviceTokenService.sendUserNotification(
          data._id,
          key,
          title,
          message,
          null,
          data._id,
          nameForTracking,
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
