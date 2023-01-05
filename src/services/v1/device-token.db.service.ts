import { DeviceToken } from "../../model/deviceToken";

class DeviceTokenDBService {
  /**
   * @description get the users token data
   * @param id
   */
  public async getDeviceTokenDataOfUser(id: any) {
    const queryFindDeviceTokenData = [
      {
        $match: { userId: id },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userNotificationInfo",
        },
      },
      {
        $unwind: {
          path: "$userNotificationInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          isNotificationOn: "$userNotificationInfo.isNotificationOn",
          deviceToken: 1,
        },
      },
    ];
    let deviceTokenData: any = await DeviceToken.aggregate(
      queryFindDeviceTokenData
    ).exec();

    deviceTokenData = deviceTokenData.length > 0 ? deviceTokenData[0] : null;
    return deviceTokenData;
  }
}

export default new DeviceTokenDBService();
