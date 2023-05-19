import { UserTable } from "@app/model";
import moment from "moment";
import { NOTIFICATIONS, NOTIFICATION_KEYS } from "@app/utility";
import { DeviceTokenServiceV4 } from "@app/services/v4";
import userDbService from "@app/services/v4/user.db.service";

export const kycReminderHandler = async () => {
  console.log("==========Start Cron For Kyc Reminder=============");
  const currentTime = moment().unix();
  const onboardedParents = await userDbService.getLatestOnBoardedParents();
  const userIds = [];
  if (onboardedParents.length === 0) return false;
  await Promise.all(
    onboardedParents.map(async (data: any) => {
      let createdAt = moment(data.createdAt).add(3, "hours").unix();
      if (createdAt <= currentTime) {
        userIds.push(data._id);
      }
      return true;
    })
  );
  const { key, title, message, nameForTracking } =
    NOTIFICATIONS.COMPLETE_KYC_REMINDER;
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
        isParentOnboardingReminderSent: true,
      },
    }
  );
  return true;
};
