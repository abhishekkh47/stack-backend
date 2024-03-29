import {
  BusinessProfileTable,
  UserTable,
  BusinessPassionTable,
} from "@app/model";
import { NetworkError } from "@app/middleware";
import {
  INVALID_DESCRIPTION_ERROR,
  SYSTEM_INPUT,
  BUSINESS_ACTIONS,
  IS_RETRY,
  REQUIRE_COMPANY_NAME,
  BACKUP_LOGOS,
  MAXIMIZE_BUSINESS_IMAGES,
} from "@app/utility";
import moment from "moment";
import { BusinessProfileService as BusinessProfileServiceV7 } from "@app/services/v7";

class BusinessProfileService {
  /**
   * @description this will generate business idea using OpenAI GPT
   * @param userExists
   * @param key
   * @param userBusinessProfile
   * @param isRetry
   * @returns {*}
   */
  public async generateAISuggestions(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    isRetry: any = false
  ) {
    try {
      let response = null;
      if (!userBusinessProfile.isRetry || isRetry == IS_RETRY.TRUE) {
        const prompt = `Business Name:${userBusinessProfile.companyName}, Business Description: ${userBusinessProfile.description}`;
        const [textResponse, _] = await Promise.all([
          BusinessProfileServiceV7.generateTextSuggestions(
            SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
            prompt
          ),
          BusinessProfileTable.findOneAndUpdate(
            { userId: userExists._id },
            { $set: { isRetry: true } }
          ),
        ]);
        response = JSON.parse(textResponse.choices[0].message.content);
      }
      return {
        suggestions: response,
        finished: true,
        isRetry: true,
        companyName: REQUIRE_COMPANY_NAME.includes(key)
          ? userBusinessProfile.companyName
          : null,
      };
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }

  /**
   * @description this will generate image suggestions using OpenAI GPT and MidJourney
   * @param userExists
   * @param key
   * @param userBusinessProfile
   * @param isRetry
   * @param requestId
   * @param isSystemCall signifies that the function call has been made by system internally, when user completes day-2, quiz-1 to generate images before user plays action-3
   * @param isFromProfile this will be true if user generate AI logos by visiting the profile page
   * @returns {*}
   */
  public async generateAILogos(
    userExists: any,
    key: string,
    userBusinessProfile: any,
    isRetry: string = IS_RETRY.FALSE,
    requestId: string = null,
    isSystemCall: boolean = false,
    isFromProfile: string = IS_RETRY.FALSE
  ) {
    try {
      let response = null;
      await UserTable.findOneAndUpdate(
        { _id: userExists._id },
        { $set: { requestId } },
        { upsert: true }
      );

      const { logoGenerationInfo, companyName, description } =
        userBusinessProfile;
      const {
        aiSuggestions,
        isUnderProcess,
        startTime,
        isInitialSuggestionsCompleted,
      } = logoGenerationInfo;
      const elapsedTime = moment().unix() - startTime;
      let finished = aiSuggestions?.length === 4;
      if (
        isRetry.toString() == IS_RETRY.FALSE &&
        !isUnderProcess &&
        !finished &&
        !isSystemCall
      ) {
        return {
          finished: true,
          suggestions: isFromProfile == IS_RETRY.TRUE ? null : BACKUP_LOGOS,
          isRetry: true,
        };
      }
      if (
        (!finished && !isUnderProcess) ||
        (!isUnderProcess && isRetry == IS_RETRY.TRUE && finished) ||
        (isUnderProcess && elapsedTime > 200) ||
        isSystemCall
      ) {
        const prompt = `Business Name:${companyName}, Business Description: ${description}`;
        const [textResponse, _] = await Promise.all([
          BusinessProfileServiceV7.generateTextSuggestions(
            SYSTEM_INPUT[BUSINESS_ACTIONS[key]],
            prompt
          ),
          BusinessProfileTable.findOneAndUpdate(
            { userId: userExists._id },
            {
              $set: {
                "logoGenerationInfo.isUnderProcess": true,
                "logoGenerationInfo.startTime": moment().unix(),
                "logoGenerationInfo.aiSuggestions": null,
              },
            },
            { upsert: true }
          ),
        ]);
        const imageURLs =
          await BusinessProfileServiceV7.generateImageSuggestions(
            textResponse.choices[0].message.content
          );
        response = [...imageURLs];
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          {
            $set: {
              "logoGenerationInfo.isUnderProcess": false,
              "logoGenerationInfo.startTime": moment().unix(),
              "logoGenerationInfo.aiSuggestions": response,
              "logoGenerationInfo.isInitialSuggestionsCompleted": true,
            },
          },
          { upsert: true }
        );
      }
      if (
        isUnderProcess &&
        isRetry == IS_RETRY.FALSE &&
        !isInitialSuggestionsCompleted &&
        isFromProfile == IS_RETRY.FALSE
      ) {
        await BusinessProfileTable.findOneAndUpdate(
          { userId: userExists._id },
          {
            $set: {
              "logoGenerationInfo.isUnderProcess": false,
              "logoGenerationInfo.startTime": moment().unix(),
              "logoGenerationInfo.aiSuggestions": response,
              "logoGenerationInfo.isInitialSuggestionsCompleted": true,
            },
          },
          { upsert: true }
        );
        return {
          finished: true,
          suggestions: BACKUP_LOGOS,
          isRetry: true,
        };
      }

      if (isRetry == IS_RETRY.TRUE && isUnderProcess) {
        finished = false;
      }
      return {
        finished,
        suggestions: finished ? (response ? response : aiSuggestions) : null,
        isRetry: true,
      };
    } catch (error) {
      return {
        finished: true,
        suggestions: BACKUP_LOGOS,
        isRetry: true,
      };
    }
  }

  /**
   * @description this will generate business idea using OpenAI GPT
   * @param data
   * @returns {*}
   */
  public async generateBusinessIdea(
    systemInput: string,
    prompt: string,
    passion: string,
    userExists: any,
    isRetry: string,
    userBusinessProfile: any
  ) {
    try {
      let newResponse = null;
      if (!userBusinessProfile?.isRetry || isRetry == IS_RETRY.TRUE) {
        let [response, businessPassionImages, _] = await Promise.all([
          BusinessProfileServiceV7.generateTextSuggestions(systemInput, prompt),
          BusinessPassionTable.find({ title: passion }),
          BusinessProfileTable.findOneAndUpdate(
            { userId: userExists._id },
            { $set: { isRetry: true } }
          ),
        ]);

        if (
          !response.choices[0].message.content.includes(
            "businessDescription"
          ) ||
          !response.choices[0].message.content.includes("opportunityHighlight")
        ) {
          throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
        }

        newResponse = JSON.parse(response.choices[0].message.content);
        if (!businessPassionImages.length) {
          newResponse.map(
            (idea, idx) => (idea["image"] = MAXIMIZE_BUSINESS_IMAGES[idx])
          );
        } else {
          newResponse.map(
            (idea, idx) =>
              (idea["image"] = businessPassionImages[0].businessImages[idx])
          );
        }
      }
      return newResponse;
    } catch (error) {
      throw new NetworkError(INVALID_DESCRIPTION_ERROR, 400);
    }
  }
}
export default new BusinessProfileService();
