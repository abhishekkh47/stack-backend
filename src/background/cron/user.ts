import { UserTable } from "../../model";
import moment from "moment";
import { NOTIFICATION, NOTIFICATION_KEYS } from "../../utility/constants";
import { DeviceTokenService } from "../../services/v1";

export const kycReminderHandler = async () => {
  let currentTime = moment().unix();
  let user = await UserTable.aggregate([
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $match: {
        type: 2,
        status: 0,
        mobile: { $ne: null },
        referralCode: { $ne: null },
        isParentOnboardingReminderSent: false,
      },
    },
  ]).exec();
  let userIds = [];
  if (user.length === 0) return false;
  await Promise.all(
    user.map(async (data: any) => {
      let createdAt = moment(data.createdAt).add(3, "hours").unix();
      if (createdAt <= currentTime) {
        await DeviceTokenService.sendUserNotification(
          data._id,
          NOTIFICATION_KEYS.COMPLETE_KYC_REMINDER,
          NOTIFICATION.COMPLETE_KYC_REMINDER_TITLE,
          NOTIFICATION.COMPLETE_KYC_REMINDER_MESSAGE,
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
        isParentOnboardingReminderSent: true,
      },
    }
  );
  return true;
};
