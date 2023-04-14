import { UserTable } from "../../model";
import moment from "moment";
import { NOTIFICATIONS } from "../../utility/constants";
import { DeviceTokenService } from "../../services/v1";
import userDbService from "../../services/v4/user.db.service";

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
        const { key, title, message, nameForTracking } = NOTIFICATIONS.COMPLETE_KYC_REMINDER
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
        isParentOnboardingReminderSent: true,
      },
    }
  );
  return true;
};
