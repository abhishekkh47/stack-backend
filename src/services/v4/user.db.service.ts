import {
  deleteAccountInformationInZoho,
  searchAccountInfoByEmail,
  updateAccountToPendingClosure,
  uploadFilesFetch,
  LIST,
} from "@app/utility/index";
import { NetworkError } from "@app/middleware/error.middleware";
import {
  UserTable,
  ParentChildTable,
  DripshopTable,
  LeagueTable,
  SearchHistoryTable,
} from "@app/model";
import fs from "fs";
import moment from "moment";
import path from "path";
import { EUSERSTATUS, EUserType } from "@app/types";
import { AuthService } from "@app/services/v1";
import { LeagueService } from "@app/services/v4";

class UserDBService {
  /**
   * @description get latest onboarded parents
   */
  public async getLatestOnBoardedParents() {
    const parents = await UserTable.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $match: {
          type: 2,
          status: 0,
          mobile: { $ne: null },
          referralCode: { $ne: null },
          isParentOnboardingReminderSent: false,
        },
      },
    ]).exec();
    return parents;
  }

  /**
   * @description get prime trust balance
   * @param emails
   */
  public async getUserDetails(emails) {
    const users = await UserTable.aggregate([
      {
        $match: {
          type: 1,
          email: { $in: emails },
        },
      },
      {
        $lookup: {
          from: "parentchild",
          localField: "_id",
          foreignField: "teens.childId",
          as: "teenUser",
        },
      },
      {
        $unwind: {
          path: "$teenUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          accountDetails: {
            $filter: {
              input: "$teenUser.teens",
              as: "list",
              cond: {
                $eq: ["$$list.childId", "$_id"],
              },
            },
          },
        },
      },
    ]).exec();
    if (users.length == 0) {
      throw new NetworkError("Users not found", 400);
    }
    return users;
  }

  /**
   * @description search zoho data and delete it
   * @param emails
   * @param zohoAccessToken
   */
  public async searchAndDeleteZohoAccounts(emails, zohoAccessToken) {
    const zohoCrmAccounts = await Promise.all(
      await emails.map(async (data: any) => {
        let crmAccount: any = await searchAccountInfoByEmail(
          zohoAccessToken,
          data
        );
        if (
          crmAccount.status == 200 &&
          crmAccount.data &&
          crmAccount.data.data.length > 0
        ) {
          await deleteAccountInformationInZoho(
            zohoAccessToken,
            crmAccount.data.data[0].id
          );
          return data;
        }
      })
    );
    return zohoCrmAccounts;
  }

  /**
   * @description search zoho data and delete it
   * @param token
   * @param accountIds
   */
  public async updatePTAccountsToPendingClosure(token, accountIds) {
    const pendingClosedAccounts = await Promise.all(
      await accountIds.map(async (data: any) => {
        let accountData = await updateAccountToPendingClosure(token, data);
        if (accountData.status == 200) {
          return accountIds;
        }
      })
    );
    return pendingClosedAccounts;
  }

  /*
   * @description Upload Proof of address, documents in prime trust
   * @param userExists
   * @param body
   */
  public async updatePrimeTrustMedia(userExists, body, jwtToken, filesArray) {
    /**
     * Validations to be done
     */
    const parentChildExists = await ParentChildTable.findOne({
      userId: userExists._id,
    });
    if (!parentChildExists) {
      throw new NetworkError("User Not Found", 400);
    }

    let existingStatus = (
      await UserTable.findOne({ _id: userExists._id }, { status: 1, _id: 0 })
    ).status;
    if (
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED ||
      existingStatus === EUSERSTATUS.KYC_DOCUMENT_UPLOAD
    ) {
      throw new NetworkError(
        existingStatus === EUSERSTATUS.KYC_DOCUMENT_VERIFIED
          ? "User already verified."
          : "User's data already uploaded.",
        400
      );
    }

    let successResponse: any = {};

    // in case of proof of address file upload
    if (filesArray.address_proof) {
      const accountIdDetails: any =
        userExists.type === EUserType.SELF
          ? parentChildExists
          : await parentChildExists.teens.find(
              (x: any) =>
                x.childId.toString() ==
                parentChildExists.firstChildId.toString()
            );
      if (!accountIdDetails) {
        throw new NetworkError("Account Details Not Found", 400);
      }
      const fullName = userExists.firstName + " " + userExists.lastName;

      let addressDocumentId = null;
      let uploadFileError = null;
      let uploadData = {
        "contact-id": parentChildExists.contactId,
        description: "Proof of Address",
        label: "Proof of Address",
        public: "true",
        file: fs.createReadStream(
          path.join(
            __dirname,
            "../../../uploads",
            filesArray.address_proof[0].filename
          )
        ),
      };
      let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
      if (uploadFile.status == 400) uploadFileError = uploadFile.message;
      if (uploadFile.status == 200 && uploadFile.message.errors != undefined)
        uploadFileError = uploadFile.message;
      if (uploadFileError) throw new NetworkError(uploadFileError, 400);

      addressDocumentId = uploadFile.message.data.id;
      /**
       * Updating the info in parent child table
       */
      await ParentChildTable.updateOne(
        {
          userId: userExists._id,
          "teens.childId": parentChildExists.firstChildId,
        },
        {
          $set: {
            proofOfAddressId: addressDocumentId,
          },
        }
      );
      successResponse.uploadAddressProofReponse = {
        message:
          "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
      };
    }

    // in case of driving license file upload
    if (filesArray.id_proof_front && filesArray.id_proof_back) {
      let files = [...filesArray.id_proof_front, ...filesArray.id_proof_back];
      /**
       * Upload both file
       */
      let frontDocumentId = null;
      let backDocumentId = null;
      let uploadFileError = null;
      for await (let fileData of files) {
        let uploadData = {
          "contact-id": parentChildExists.contactId,
          description:
            fileData.fieldname == "id_proof_front"
              ? "Front Side Driving License"
              : "Back Side Driving License",
          label:
            fileData.fieldname == "id_proof_back"
              ? "Front Side Driving License"
              : "Back Side Driving License",
          public: "true",
          file: fs.createReadStream(
            path.join(__dirname, "../../../uploads", fileData.filename)
          ),
        };
        let uploadFile: any = await uploadFilesFetch(jwtToken, uploadData);
        if (uploadFile.status == 400) {
          uploadFileError = uploadFile.message;
          break;
        }
        if (
          uploadFile.status == 200 &&
          uploadFile.message.errors != undefined
        ) {
          uploadFileError = uploadFile.message;
          break;
        }
        fileData.fieldname == "id_proof_front"
          ? (frontDocumentId = uploadFile.message.data.id)
          : (backDocumentId = uploadFile.message.data.id);
      }
      if (uploadFileError) {
        throw new NetworkError(uploadFileError, 400);
      }

      await AuthService.updateKycDocumentChecks(
        parentChildExists,
        jwtToken,
        frontDocumentId,
        backDocumentId,
        userExists
      );
    }
  }

  /**
   * @description This method will return ranking of teens based on xpPoints
   * @param userIfExists
   * @param query
   * @returns {*}
   */
  public async getLeaderboards(userIfExists: any, query: any) {
    let leagueDetails = null;
    let userObject = null;
    let aggregateQuery: any = [
      {
        $setWindowFields: {
          sortBy: {
            xpPoints: -1,
          },
          output: {
            rank: {
              $documentNumber: {},
            },
            total: {
              $count: {},
            },
          },
        },
      },
      {
        $limit: query?.page ? LIST.limit * parseInt(query?.page) : 20,
      },
      {
        $project: {
          _id: 1,
          type: 1,
          firstName: 1,
          lastName: 1,
          rank: 1,
          xpPoints: 1,
          total: 1,
          profilePicture: 1,
        },
      },
    ];
    if (query?.league && userIfExists.xpPoints > 0) {
      leagueDetails = await LeagueTable.findOne({
        _id: query.league,
      }).select("_id name image colorCode minPoint maxPoint");
      if (!leagueDetails) {
        throw new NetworkError("Leagues Found", 400);
      }
      aggregateQuery.unshift({
        $match: {
          xpPoints: {
            $lte: leagueDetails.maxPoint,
            $gte: leagueDetails.minPoint,
          },
        },
      });
      if (query?.page) {
        const offset = (parseInt(query.page) - 1) * LIST.limit;
        aggregateQuery.push({ $skip: offset });
        const userDetails = await UserTable.aggregate([
          {
            $match: {
              xpPoints: {
                $lte: leagueDetails.maxPoint,
                $gte: leagueDetails.minPoint,
              },
            },
          },
          {
            $setWindowFields: {
              sortBy: {
                xpPoints: -1,
              },
              output: {
                rank: {
                  $documentNumber: {},
                },
              },
            },
          },
          {
            $match: {
              _id: userIfExists._id,
            },
          },
          {
            $addFields: {
              leagueDetails: null,
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              rank: 1,
              xpPoints: 1,
              profilePicture: 1,
            },
          },
        ]).exec();
        userObject = userDetails.length > 0 ? userDetails[0] : null;
      }
    }
    let leaderBoardData: any = await UserTable.aggregate(aggregateQuery).exec();
    if (!userObject) {
      const userExistsInLeaderBoard =
        leaderBoardData?.find(
          (x) => x._id.toString() === userIfExists._id.toString()
        ) || null;
      userObject = {
        _id: userIfExists._id,
        rank: userExistsInLeaderBoard ? userExistsInLeaderBoard.rank : 21,
        leagueDetails: null,
        xpPoints: userIfExists.xpPoints,
        firstName: userIfExists.firstName,
        profilePicture: userIfExists.profilePicture,
      };
    }
    if (leagueDetails) {
      userObject = { ...userObject, leagueDetails };
    }
    return {
      leaderBoardData,
      userObject,
      totalRecords: leaderBoardData.length > 0 ? leaderBoardData[0].total : 0,
    };
  }

  /**
   * @description This service is used to update the fuels of user
   * @param userExists
   * @param dripshopData
   * @param fuel
   */
  public async redeemDripShop(userExists: any, dripshopData: any, body: any) {
    const { fuel } = dripshopData;
    let totalChildFuels = userExists.preLoadedCoins + userExists.quizCoins;

    let updatedCoinQuery: any = {};

    if (totalChildFuels >= fuel) {
      /**
       * once true check what to update preloaded or quiz coins or both
       */
      if (userExists.preLoadedCoins >= fuel) {
        updatedCoinQuery = {
          ...updatedCoinQuery,
          $set: {
            preLoadedCoins: userExists.preLoadedCoins - fuel,
          },
        };
      } else {
        /**
         * amountLeftAfterPreloaded - contains amount left after removal of preloaded coins from required fuels
         */
        let amountLeftAfterPreloaded = fuel - userExists.preLoadedCoins;

        if (amountLeftAfterPreloaded <= userExists.quizCoins) {
          updatedCoinQuery = {
            ...updatedCoinQuery,
            $set: {
              preLoadedCoins: 0,
              quizCoins: userExists.quizCoins - amountLeftAfterPreloaded,
            },
          };
        }
      }
    } else {
      throw new NetworkError("Insufficient Fuels.", 400);
    }
    const createdDripshop = await DripshopTable.create({
      firstName: body.firstName,
      lastName: body.lastName,
      redeemedFuels: fuel,
      userId: userExists._id,
      itemId: dripshopData._id,
      address: body.address,
      state: body.state,
      city: body.city,
      apartment: body.apartment || null,
      zipCode: body.zipCode,
      selectedSize: body.selectedSize || null,
    });
    const updatedUser = await UserTable.findOneAndUpdate(
      {
        _id: userExists._id,
      },
      updatedCoinQuery,
      { new: true }
    );

    return { createdDripshop, updatedUser };
  }

  /**
   * @description This service is used to store users search input
   * @param userId
   * @param searchInput
   * @returns {boolean}
   */
  public async storeUsersSearchInput(userId: string, searchInput: string) {
    const userSearchInput = await SearchHistoryTable.find({ userId });
    const isSearchInputValid =
      userSearchInput.length === 0 ||
      !userSearchInput.some(
        (x) => x.searchInput.toLowerCase() === searchInput.toLowerCase()
      );
    if (isSearchInputValid) {
      await SearchHistoryTable.create({
        userId,
        searchInput: searchInput.toLowerCase(),
      });
      return true;
    }
    return false;
  }
}

export default new UserDBService();
