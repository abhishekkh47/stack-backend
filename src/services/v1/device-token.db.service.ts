import { DeviceToken } from "@app/model";
import { ObjectId } from "mongodb";

class DeviceTokenDBService {
  /**
   * @description get the users token data
   * @param id
   */
  public async getDeviceTokenDataOfUser(id: any) {
    const queryFindDeviceTokenData = [
      {
        $match: { userId: new ObjectId(id) },
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
          _id: "$userId",
          deviceToken: {
            $addToSet: "$deviceToken",
          },
          isNotificationOn: {
            $first: "$userNotificationInfo.isNotificationOn",
          },
        },
      },
    ];
    let deviceTokenData: any = await DeviceToken.aggregate(
      queryFindDeviceTokenData
    ).exec();

    deviceTokenData = deviceTokenData.length > 0 ? deviceTokenData[0] : null;
    return deviceTokenData;
  }

  /**
   * @description get the users token data for cron
   * @param id
   */
  public async getDeviceTokenDataOfUsers(ids: string[]) {
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

export default new DeviceTokenDBService();
