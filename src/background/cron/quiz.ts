import { AdminTable, QuizResult } from "../../model";
import moment from "moment";
import { NOTIFICATION, NOTIFICATION_KEYS } from "../../utility/constants";
import { DeviceTokenService } from "../../services/v1";

export const challengeAvailableHandler = async () => {
  console.log("==========Start Cron For Challenge Available=============");
  const currentTime = moment().unix();
  const admin = await AdminTable.findOne({});
  const hoursToAdd = admin.quizCooldown[1.9];
  const quizResults = await QuizResult.aggregate([
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "users",
      },
    },
    {
      $unwind: {
        path: "$users",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $redact: {
        $cond: {
          if: {
            $eq: ["$users.type", 1],
          },
          then: "$$KEEP",
          else: "$$PRUNE",
        },
      },
    },
    {
      $group: {
        _id: "$userId",
        pointsEarned: {
          $first: "$pointsEarned",
        },
        createdAt: {
          $first: "$createdAt",
        },
      },
    },
  ]).exec();
  if (quizResults.length === 0) return false;
  await Promise.all(
    quizResults.map(async (data: any) => {
      let createdAt = moment(data.createdAt).add(hoursToAdd, "hours").unix();
      if (createdAt <= currentTime) {
        await DeviceTokenService.sendUserNotification(
          data._id,
          NOTIFICATION_KEYS.CHALLENGE_AVAILABLE,
          NOTIFICATION.CHALLENGE_AVAILABLE_TITLE,
          NOTIFICATION.CHALLENGE_AVAILABLE_MESSAGE,
          null,
          data._id
        );
      }
      return true;
    })
  );
  return true;
};
