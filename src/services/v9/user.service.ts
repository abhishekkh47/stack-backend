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
      { usedAITools: 1 }
    );
    return response[0].usedAITools;
  }
}

export default new UserService();
