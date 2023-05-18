import { ENOTIFICATIONSETTINGS, ERead } from "@app/types";
import { sendNotification } from "@app/utility";
import { DeviceToken, Notification } from "@app/model";
import { DeviceTokenDBService } from ".";
import { AnalyticsService } from "../v4";
import { ANALYTICS_EVENTS } from "../../utility/constants";

class DeviceTokenService {
  public async addDeviceTokenIfNeeded(userId: string, deviceToken: string) {
    if (!deviceToken) {
      return;
    }

    const checkDeviceTokenExists = await DeviceToken.findOne({
      userId,
    });
    if (!checkDeviceTokenExists) {
      await DeviceToken.create({
        userId,
        "deviceToken.0": deviceToken,
      });
    } else {
      if (!checkDeviceTokenExists.deviceToken.includes(deviceToken)) {
        await DeviceToken.updateOne(
          { _id: checkDeviceTokenExists._id },
          {
            $push: {
              deviceToken: deviceToken,
            },
          }
        );
      }
    }
  }

  public async removeDeviceToken(userId: string, deviceToken: string) {
    const deviceTokens = await DeviceToken.findOne({ userId });
    if (!deviceTokens) {
      return false;
    }
    if (deviceTokens.deviceToken.includes(deviceToken)) {
      await DeviceToken.updateOne(
        { userId },
        {
          $pull: {
            deviceToken: deviceToken,
          },
        }
      );
    } else {
      // throw new Error("Device Token Doesn't Exist");
    }
  }

  /**
   * @description This service is used to send notification
   * @param id
   * @param notificationKey
   * @param notificationTitle
   * @param notificationMessage
   */
  public async sendUserNotification(
    id: any,
    notificationKey: any,
    notificationTitle: any,
    notificationMessage: any,
    activityId: any = null,
    userId: any = null,
    nameForTracking: string = null,
  ) {
    let deviceTokenData = await DeviceTokenDBService.getDeviceTokenDataOfUser(
      id
    );

    if (
      deviceTokenData &&
      deviceTokenData.deviceToken.length > 0 &&
      deviceTokenData.isNotificationOn == ENOTIFICATIONSETTINGS.ON
    ) {
      let notificationRequest = {
        key: notificationKey,
        title: notificationTitle,
        message: notificationMessage,
        activityId: activityId,
        userId: userId,
        nameForTracking,
      };
      await sendNotification(
        deviceTokenData.deviceToken,
        notificationRequest.title,
        notificationRequest
      );
      await Notification.create({
        title: notificationRequest.title,
        userId: id,
        message: notificationRequest.message,
        isRead: ERead.UNREAD,
        data: JSON.stringify(notificationRequest),
      });

      if (nameForTracking) {
        AnalyticsService.sendEvent(
          ANALYTICS_EVENTS.PUSH_NOTIFICATION_SENT,
          {
            'Push notification name': nameForTracking,
          },
          {
            user_id: userId
          }
        );
      }
    }
    return true;
  }
}

export default new DeviceTokenService();
