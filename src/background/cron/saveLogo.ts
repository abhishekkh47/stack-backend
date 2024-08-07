import moment from "moment";
import { UnsavedLogoTable, BusinessProfileTable } from "@app/model";
import { processImages } from "@app/utility";

export const processPendingLogos = async () => {
  console.log(
    "==========Start Cron for Uploading Pending Logos on AWS S3============="
  );
  try {
    const pendingLogos = await UnsavedLogoTable.find();
    const currentTime = moment().unix();
    const userIds = pendingLogos
      .filter((user) => {
        const timeDiff = moment.duration(
          currentTime - user.logoGeneratedAt,
          "seconds"
        );
        const timeDiffHours = timeDiff.asHours();
        return timeDiffHours > 12;
      })
      .map((user) => user.userId);
    const businessProfiles = await BusinessProfileTable.find({
      userId: { $in: userIds },
    });
    const usersToDelete = [];

    const updatePromises = businessProfiles.map(async (businessProfile) => {
      const { userId, logoGenerationInfo } = businessProfile;
      const { aiSuggestions } = logoGenerationInfo;
      const newUrls = await processImages(userId.toString(), aiSuggestions);
      await BusinessProfileTable.findOneAndUpdate(
        { userId },
        {
          $set: {
            "logoGenerationInfo.aiSuggestions": newUrls,
          },
        }
      );

      usersToDelete.push(userId);
    });
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    if (usersToDelete.length > 0) {
      await UnsavedLogoTable.deleteMany({ userId: { $in: usersToDelete } });
      console.log(
        "Processed and deleted pending logos for user IDs:",
        usersToDelete
      );
    } else {
      console.log("No Users Found to update business logo URLs.");
    }
  } catch (error) {
    console.error("Error processing pending logos:", error);
  }
};
