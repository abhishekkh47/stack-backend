import { DeviceToken } from "@app/model";

class DeviceTokenDBServiceV4 {
  /**
   * @description get the users token data
   * @param id
   */
  public async getDeviceTokenDataOfUser(ids: string[]) {
    const queryFindDeviceTokenData: any = [
      {
        $match: {
          userId: {
            $in: ids,
          },
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
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
        $unwind: {
          path: "$deviceToken",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$deviceToken",
          userId: {
            $first: "$userId",
          },
          isNotificationOn: {
            $first: "$userNotificationInfo.isNotificationOn",
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          deviceToken: {
            $addToSet: "$_id",
          },
          isNotificationOn: {
            $first: "$isNotificationOn",
          },
        },
      },
    ];
    let deviceTokenData: any = await DeviceToken.aggregate(
      queryFindDeviceTokenData
    ).exec();

    deviceTokenData = deviceTokenData.length > 0 ? deviceTokenData : null;
    return deviceTokenData;
  }
}

export default new DeviceTokenDBServiceV4();
