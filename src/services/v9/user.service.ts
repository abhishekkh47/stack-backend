import { AIToolsUsageStatusTable } from "@app/model";

class UserService {
  /**
   * @description This service is used to check what AI tools the user has already visited
   * @param userIfExists
   */
  public async userAIToolUsageStatus(userIfExists: any) {
    const response = await AIToolsUsageStatusTable.find(
      {
        userId: userIfExists._id,
      },
      {
        _id: 0,
        description: 1,
        ideaValidation: 1,
        targetAudience: 1,
        companyName: 1,
        companyLogo: 1,
        colorsAndAesthetic: 1,
        competitors: 1,
      }
    );
    return response[0];
  }
}

export default new UserService();
