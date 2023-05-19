import { ENOTIFICATIONSETTINGS, ERead } from "@app/types";
import { sendNotification } from "@app/utility";
import { DeviceToken, Notification } from "@app/model";
import { DeviceTokenDBServiceV4 } from ".";
import { AnalyticsService } from "../v4";
import { ANALYTICS_EVENTS } from "../../utility/constants";

class DeviceTokenServiceV4 {
  /**
   * @description This service is used to send notification in cronjob
   * @param id
   * @param notificationKey
   * @param notificationTitle
   * @param notificationMessage
   */
  public async sendUserNotificationForCron(
    ids: string[],
    notificationKey: any,
    notificationTitle: any,
    notificationMessage: any,
    activityId: any = null,
    userId: any = null,
    nameForTracking: string = null
  ) {
    let deviceTokenData = await DeviceTokenDBServiceV4.getDeviceTokenDataOfUser(
      ids
    );
    if (deviceTokenData.length === 0) return false;
    await Promise.all(
      deviceTokenData.map(async (data: any, index: number) => {
        if (
          data &&
          data.deviceToken.length > 0 &&
          data.isNotificationOn == ENOTIFICATIONSETTINGS.ON
        ) {
          let notificationRequest = {
            key: notificationKey,
            title: notificationTitle,
            message: notificationMessage,
            activityId: activityId,
            userId: data._id,
            nameForTracking,
          };
          await sendNotification(
            data.deviceToken,
            notificationRequest.title,
            notificationRequest
          );
          await Notification.create({
            title: notificationRequest.title,
            userId: data._id,
            message: notificationRequest.message,
            isRead: ERead.UNREAD,
            data: JSON.stringify(notificationRequest),
          });

          if (nameForTracking) {
            AnalyticsService.sendEvent(
              ANALYTICS_EVENTS.PUSH_NOTIFICATION_SENT,
              {
                "Push notification name": nameForTracking,
              },
              {
                user_id: data._id,
              }
            );
          }
        }
        return true;
      })
    );

    return true;
  }
}

export default new DeviceTokenServiceV4();
