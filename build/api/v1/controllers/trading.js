"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
const middleware_1 = require("@app/middleware");
const types_1 = require("@app/types");
const model_1 = require("@app/model");
const apiValidation_1 = require("../../../validations/apiValidation");
const userbalance_1 = require("@app/model/userbalance");
const mongodb_1 = require("mongodb");
class TradingController extends base_1.default {
    async addDepositAction(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        const jwtToken = ctx.request.primeTrustToken;
        const userExists = await model_1.UserTable.findOne({ _id: user._id });
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
        }
        return apiValidation_1.validation.addDepositValidation(reqParam, ctx, userExists.type, async (validate) => {
            if (validate) {
                if (userExists.type === types_1.EUserType.TEEN) {
                    await model_1.UserActivityTable.create({
                        userId: userExists._id,
                        userType: userExists.type,
                        message: types_1.messages.DEPOSIT,
                        currencyType: null,
                        currencyValue: reqParam.amount,
                        action: types_1.EAction.DEPOSIT,
                        status: userExists.type === types_1.EUserType.TEEN
                            ? types_1.EStatus.PENDING
                            : types_1.EStatus.PROCESSED,
                    });
                    return this.Created(ctx, {
                        message: `Your request for deposit of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it.`,
                    });
                }
                const parentDetails = await model_1.ParentChildTable.findOne({
                    userId: new mongodb_1.ObjectId(userExists._id),
                }, {
                    _id: 1,
                    firstChildId: 1,
                    contactId: 1,
                    teens: 1,
                });
                if (!parentDetails) {
                    return this.BadRequest(ctx, "User Details Not Found");
                }
                const accountIdDetails = await parentDetails.teens.find((x) => x.childId.toString() == parentDetails.firstChildId.toString());
                if (!accountIdDetails) {
                    return this.BadRequest(ctx, "Account Details Not Found");
                }
                if (reqParam.depositType == types_1.ETRANSFER.ACH) {
                    const publicTokenExchange = await (0, utility_1.getPublicTokenExchange)(reqParam.publicToken);
                    if (publicTokenExchange.status == 400) {
                        return this.BadRequest(ctx, publicTokenExchange.message);
                    }
                    const processToken = await (0, utility_1.createProcessorToken)(publicTokenExchange.data.access_token, reqParam.accountId);
                    if (processToken.status == 400) {
                        return this.BadRequest(ctx, processToken.message);
                    }
                    let contributionRequest = {
                        type: "contributions",
                        attributes: {
                            "account-id": accountIdDetails.accountId,
                            "contact-id": parentDetails.contactId,
                            "funds-transfer-method": {
                                "funds-transfer-type": "ach",
                                "ach-check-type": "personal",
                                "contact-id": parentDetails.contactId,
                                "plaid-processor-token": processToken.data.processor_token,
                            },
                            amount: reqParam.amount,
                        },
                    };
                    console.log(contributionRequest, "contributionRequest");
                    const contributions = await (0, utility_1.createContributions)(jwtToken, contributionRequest);
                    if (contributions.status == 400) {
                        return this.BadRequest(ctx, contributions.message);
                    }
                    await model_1.UserActivityTable.create({
                        userId: userExists._id,
                        userType: userExists.type,
                        message: types_1.messages.DEPOSIT,
                        currencyType: null,
                        currencyValue: reqParam.amount,
                        action: types_1.EAction.DEPOSIT,
                        resourceId: contributions.data.included[0].id,
                        status: types_1.EStatus.PENDING,
                    });
                    return this.Created(ctx, {
                        message: `We are looking into your request and will proceed surely in some amount of time.`,
                        data: contributions.data,
                    });
                }
            }
        });
    }
    async withdrawMoney(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        const jwtToken = ctx.request.primeTrustToken;
        const userExists = await model_1.UserTable.findOne({ _id: user._id });
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
        }
        return apiValidation_1.validation.withdrawMoneyValidation(reqParam, ctx, userExists.type, async (validate) => {
            if (validate) {
                const userBalance = await userbalance_1.UserWalletTable.findOne({
                    userId: userExists._id,
                });
                if (!userBalance || userBalance.balance < reqParam.amount) {
                    return this.BadRequest(ctx, "You dont have sufficient balance to withdraw money");
                }
                const checkUserActivityForWithdraw = await model_1.UserActivityTable.aggregate([
                    {
                        $match: {
                            userId: userExists._id,
                            action: types_1.EAction.WITHDRAW,
                            status: types_1.EStatus.PENDING,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: "$currencyValue",
                            },
                        },
                    },
                ]).exec();
                if (checkUserActivityForWithdraw.length > 0) {
                    if (userBalance.balance <
                        checkUserActivityForWithdraw[0].total + reqParam.amount) {
                        return this.BadRequest(ctx, "Please cancel your existing request in order to withdraw money from this request");
                    }
                }
                if (userExists.type == types_1.EUserType.TEEN) {
                    await model_1.UserActivityTable.create({
                        userId: userExists._id,
                        userType: userExists.type,
                        message: types_1.messages.WITHDRAW,
                        currencyType: null,
                        currencyValue: reqParam.amount,
                        action: types_1.EAction.WITHDRAW,
                        status: userExists.type === types_1.EUserType.TEEN
                            ? types_1.EStatus.PENDING
                            : types_1.EStatus.PROCESSED,
                    });
                    return this.Created(ctx, {
                        message: `Your request for withdrawal of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`,
                    });
                }
                if (reqParam.withdrawType != types_1.ETRANSFER.ACH) {
                    return this.BadRequest(ctx, "Please select ach as transfer method");
                }
                if (userExists.type === types_1.EUserType.PARENT) {
                    const parentDetails = await model_1.ParentChildTable.findOne({
                        userId: new mongodb_1.ObjectId(userExists._id),
                    }, {
                        _id: 1,
                        firstChildId: 1,
                        contactId: 1,
                        teens: 1,
                    });
                    if (!parentDetails) {
                        return this.BadRequest(ctx, "User Details Not Found");
                    }
                    const accountIdDetails = await parentDetails.teens.find((x) => x.childId.toString() == parentDetails.firstChildId.toString());
                    if (!accountIdDetails) {
                        return this.BadRequest(ctx, "Account Details Not Found");
                    }
                    const publicTokenExchange = await (0, utility_1.getPublicTokenExchange)(reqParam.publicToken);
                    if (publicTokenExchange.status == 400) {
                        return this.BadRequest(ctx, publicTokenExchange.message);
                    }
                    const processToken = await (0, utility_1.createProcessorToken)(publicTokenExchange.data.access_token, reqParam.accountId);
                    if (processToken.status == 400) {
                        return this.BadRequest(ctx, processToken.message);
                    }
                    let disbursementRequest = {
                        type: "disbursements",
                        attributes: {
                            "account-id": accountIdDetails.accountId,
                            "contact-id": parentDetails.contactId,
                            "funds-transfer-method": {
                                "funds-transfer-type": "ach",
                                "ach-check-type": "personal",
                                "contact-id": parentDetails.contactId,
                                "plaid-processor-token": processToken.data.processor_token,
                            },
                            amount: reqParam.amount,
                        },
                    };
                    console.log(disbursementRequest, "disbursementRequest");
                    const disbursement = await (0, utility_1.createDisbursements)(jwtToken, disbursementRequest);
                    if (disbursement.status == 400) {
                        return this.BadRequest(ctx, disbursement.message);
                    }
                    return this.Created(ctx, {
                        message: "Amount Withdrawal Successfully to Bank",
                        data: disbursement.data,
                    });
                }
            }
        });
    }
    async seePendingActivity(ctx) {
        var e_1, _a;
        const user = ctx.request.user;
        const userExists = await model_1.UserTable.findOne({ _id: user._id });
        if (!userExists) {
            return this.BadRequest(ctx, "User not Found");
        }
        const activities = await model_1.UserActivityTable.find({
            userId: user._id,
            status: { $in: [types_1.EStatus.PENDING, types_1.EStatus.PROCESSED] },
        }, {
            message: 1,
            action: 1,
            status: 1,
            currencyValue: 1,
        }).sort({ updatedAt: -1 });
        if (activities.length === 0) {
            return this.BadRequest(ctx, "No Activity Found");
        }
        const pendingActivity = [];
        const processedActivity = [];
        try {
            for (var activities_1 = __asyncValues(activities), activities_1_1; activities_1_1 = await activities_1.next(), !activities_1_1.done;) {
                const activity = activities_1_1.value;
                activity.status === types_1.EStatus.PENDING
                    ? await pendingActivity.push(activity)
                    : await processedActivity.push(activity);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (activities_1_1 && !activities_1_1.done && (_a = activities_1.return)) await _a.call(activities_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return this.Ok(ctx, {
            message: "Success",
            data: { pending: pendingActivity, processed: processedActivity },
        });
    }
    async cancelPendingActivity(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        const userExists = await model_1.UserTable.findOne({ _id: user._id });
        if (!userExists) {
            return this.BadRequest(ctx, "User not Found");
        }
        return apiValidation_1.validation.cancelPendingValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const userActivity = await model_1.UserActivityTable.findOne({
                    userId: userExists._id,
                    _id: reqParam.id,
                    status: types_1.EStatus.PENDING,
                });
                if (!userActivity) {
                    return this.BadRequest(ctx, "Activity not found");
                }
                await model_1.UserActivityTable.updateOne({ _id: reqParam.id }, { $set: { status: types_1.EStatus.CANCELLED } });
                return this.Ok(ctx, { message: "Activity Cancelled Successfully" });
            }
        });
    }
    async checkBalance(ctx) {
        const user = ctx.request.user;
        const userBalance = await userbalance_1.UserWalletTable.findOne({ userId: user._id }, { balance: 1 });
        return this.Ok(ctx, { balance: userBalance.balance });
    }
    async buyCrypto(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.buyCryptoValidation(reqParam, ctx, async (validate) => {
            const { amount, cryptoId } = reqParam;
            const crypto = await model_1.CryptoTable.findById({ _id: cryptoId });
            if (!crypto)
                return this.NotFound(ctx, "Crypto Not Found");
            const userBalance = (await userbalance_1.UserWalletTable.findOne({ userId: user._id }, { balance: 1 })).balance;
            if (amount > userBalance)
                return this.BadRequest(ctx, "You dont have sufficient balance to buy cryptocurrenices");
            const userType = (await model_1.UserTable.findOne({ username: user.username }, { type: 1, _id: -1 })).type;
            if (userType === types_1.EUserType.TEEN) {
                const pendingTransactions = await model_1.UserActivityTable.aggregate([
                    {
                        $match: {
                            userId: new mongodb_1.ObjectId(user._id),
                            action: { $in: [types_1.EAction.WITHDRAW, types_1.EAction.BUY_CRYPTO] },
                            status: types_1.EStatus.PENDING,
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$currencyValue" },
                        },
                    },
                ]).exec();
                if (pendingTransactions.length > 0 &&
                    userBalance < pendingTransactions[0].total + amount) {
                    return this.BadRequest(ctx, "Please cancel your existing request in order to withdraw money from this request");
                }
            }
            await model_1.UserActivityTable.create({
                userId: user._id,
                message: types_1.messages.BUY,
                action: types_1.EAction.BUY_CRYPTO,
                currencyValue: amount,
                currencyType: cryptoId,
                userType,
                status: userType === types_1.EUserType.TEEN ? types_1.EStatus.PENDING : types_1.EStatus.PROCESSED,
            });
            const message = userType === types_1.EUserType.TEEN
                ? `Your request for buy order of crypto of ${reqParam.amount} USD has been sent to your parent. Please wait while he/she approves it`
                : `Buy order proccessed`;
            return this.Ok(ctx, { message });
        });
    }
    async getChildsActivities(ctx) {
        const { childId } = ctx.request.params;
        if (!/^[0-9a-fA-F]{24}$/.test(childId))
            return this.BadRequest(ctx, "Enter Correct Child's ID");
        const parent = await model_1.ParentChildTable.findOne({
            userId: ctx.request.user._id,
        });
        if (!parent)
            return this.BadRequest(ctx, "Invalid Parent's ID");
        let teen;
        parent.teens.forEach((current) => {
            if (current.childId.toString() === childId)
                teen = current;
        });
        if (!teen)
            this.BadRequest(ctx, "Invalid Child ID");
        const teenActivities = await model_1.UserActivityTable.find({
            userId: childId,
            status: { $in: [types_1.EStatus.PENDING, types_1.EStatus.PROCESSED] },
        }, {
            message: 1,
            action: 1,
            status: 1,
            currencyValue: 1,
        }).sort({ updatedAt: -1 });
        const pendingActivity = [];
        const processedActivity = [];
        for (const activity of teenActivities) {
            activity.status === types_1.EStatus.PENDING
                ? pendingActivity.push(activity)
                : processedActivity.push(activity);
        }
        return this.Ok(ctx, {
            message: "Success",
            data: { pending: pendingActivity, processed: processedActivity },
        });
    }
    async rejectChildsActivity(ctx) {
        const { activityId } = ctx.request.body;
        if (!/^[0-9a-fA-F]{24}$/.test(activityId))
            return this.BadRequest(ctx, "Enter Correct Activity Details");
        const parent = await model_1.ParentChildTable.findOne({
            userId: ctx.request.user._id,
        });
        if (!parent)
            return this.BadRequest(ctx, "Invalid Parent's ID");
        const activity = await model_1.UserActivityTable.findOne({ _id: activityId, status: types_1.EStatus.PENDING }, { userId: 1 });
        if (!activity)
            return this.BadRequest(ctx, "Invalid Pending Activity ID");
        let isValid = true;
        for (let i = 0; i < parent.teens.length; i++) {
            if (parent.teens[i]["childId"] === activity.userId) {
                isValid = false;
                break;
            }
        }
        if (!isValid)
            return this.BadRequest(ctx, "Invalid Pending Activity ID");
        await model_1.UserActivityTable.updateOne({ _id: activityId }, { status: types_1.EStatus.CANCELLED });
        this.Ok(ctx, { message: "Activity cancelled out successfully" });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/add-deposit", method: types_1.HttpMethod.POST }),
    (0, middleware_1.PrimeTrustJWT)(),
    (0, middleware_1.Auth)()
], TradingController.prototype, "addDepositAction", null);
__decorate([
    (0, utility_1.Route)({ path: "/withdraw-money", method: types_1.HttpMethod.POST }),
    (0, middleware_1.PrimeTrustJWT)(),
    (0, middleware_1.Auth)()
], TradingController.prototype, "withdrawMoney", null);
__decorate([
    (0, utility_1.Route)({ path: "/pending-activity", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], TradingController.prototype, "seePendingActivity", null);
__decorate([
    (0, utility_1.Route)({ path: "/cancel-pending-activity", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], TradingController.prototype, "cancelPendingActivity", null);
__decorate([
    (0, utility_1.Route)({ path: "/check-balance", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], TradingController.prototype, "checkBalance", null);
__decorate([
    (0, utility_1.Route)({ path: "/buy-crypto", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], TradingController.prototype, "buyCrypto", null);
__decorate([
    (0, utility_1.Route)({ path: "/get-childs-activities/:childId", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], TradingController.prototype, "getChildsActivities", null);
__decorate([
    (0, utility_1.Route)({ path: "/reject-childs-activity", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], TradingController.prototype, "rejectChildsActivity", null);
exports.default = new TradingController();
//# sourceMappingURL=trading.js.map