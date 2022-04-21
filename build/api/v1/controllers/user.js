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
const base_1 = __importDefault(require("./base"));
const middleware_1 = require("@app/middleware");
const apiValidation_1 = require("@app/validations/apiValidation");
const model_1 = require("@app/model");
const fs_1 = __importDefault(require("fs"));
const utility_1 = require("@app/utility");
const types_1 = require("@app/types");
const multer_1 = __importDefault(require("@koa/multer"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const mongodb_1 = require("mongodb");
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, "../../../uploads"));
    },
    filename: function (req, file, cb) {
        let type = file.originalname.split(".")[1];
        cb(null, `${file.fieldname}-${Date.now().toString(16)}.${type}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5000000,
    },
    fileFilter(req, file, cb) {
        if (!(0, utility_1.checkValidImageExtension)(file)) {
            return cb(new Error("Please upload a Image of valid extension of jpg or pdf format only."));
        }
        cb(null, true);
    },
});
class UserController extends base_1.default {
    async updateTaxInfo(ctx) {
        const input = ctx.request.body;
        return apiValidation_1.validation.updateTaxInfoRequestBodyValidation(input, ctx, async (validate) => {
            if (validate) {
                await model_1.UserTable.updateOne({ username: ctx.request.user.username }, {
                    $set: {
                        taxIdNo: input.taxIdNo,
                        taxState: input.taxState,
                    },
                });
                return this.Ok(ctx, { message: "Tax info updated successfully." });
            }
        });
    }
    async getLinkToken(ctx) {
        const userExists = await model_1.UserTable.findOne({ _id: ctx.request.user._id });
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
        }
        const linkToken = await (0, utility_1.getLinkToken)(userExists);
        if (linkToken.status == 400) {
            return this.BadRequest(ctx, linkToken.message);
        }
        return this.Ok(ctx, { data: linkToken.data });
    }
    async sendAgreementPreview(ctx) {
        const user = ctx.request.user;
        const jwtToken = ctx.request.primeTrustToken;
        const userExists = await model_1.UserTable.findOne({ _id: user._id }).populate("stateId", ["name"]);
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
        }
        const fullName = userExists.firstName + " " + userExists.lastName;
        const data = {
            type: "account",
            attributes: {
                "account-type": "custodial",
                name: fullName + " child-1",
                "authorized-signature": " ",
                owner: {
                    "contact-type": "natural_person",
                    name: fullName,
                    email: userExists.email,
                    "date-of-birth": (0, moment_1.default)(userExists.dob).format("MM/DD/YYYY"),
                    "tax-id-number": userExists.taxIdNo,
                    "tax-country": userExists.country,
                    "ip-address": "127.0.0.2",
                    geolocation: "",
                    "primary-phone-number": {
                        country: "CA",
                        number: userExists.mobile,
                        sms: false,
                    },
                    "primary-address": {
                        "street-1": userExists.address,
                        "street-2": "",
                        "postal-code": userExists.postalCode,
                        city: userExists.city,
                        region: userExists.stateId.name,
                        country: userExists.country,
                    },
                },
            },
        };
        const sendAgreementPreview = await (0, utility_1.agreementPreviews)(jwtToken, data);
        if (sendAgreementPreview.status == 400) {
            return this.BadRequest(ctx, sendAgreementPreview);
        }
        return this.Ok(ctx, { data: sendAgreementPreview.data.data });
    }
    async uploadFilesData(ctx) {
        var e_1, _a;
        const files = ctx.request.files;
        const user = ctx.request.user;
        const jwtToken = ctx.request.primeTrustToken;
        if (files.length == 0) {
            return this.BadRequest(ctx, "Please upload identification files in order to complete KYC");
        }
        let newArrayFiles = [];
        if (!files.front_side || !files.back_side) {
            return this.BadRequest(ctx, "You need to upload front and back side of driver's license");
        }
        newArrayFiles = [...files.front_side, ...files.back_side];
        if (newArrayFiles.length != 2) {
            return this.BadRequest(ctx, "You need to upload front and back side of driver's license");
        }
        const userExists = await model_1.UserTable.findOne({ _id: user._id }).populate("stateId", ["name"]);
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
        }
        const parentChildExists = await model_1.ParentChildTable.findOne({
            userId: user._id,
        });
        const fullName = userExists.firstName + " " + userExists.lastName;
        const data = {
            type: "account",
            attributes: {
                "account-type": "custodial",
                name: fullName + " child-1",
                "authorized-signature": fullName,
                "webhook-config": {
                    url: "https://eoo8gzhyo65jjji.m.pipedream.net",
                },
                owner: {
                    "contact-type": "natural_person",
                    name: fullName,
                    email: userExists.email,
                    "date-of-birth": userExists.dob,
                    "tax-id-number": userExists.taxIdNo,
                    "tax-country": userExists.country,
                    "ip-address": "127.0.0.2",
                    geolocation: "",
                    "primary-phone-number": {
                        country: "CA",
                        number: userExists.mobile,
                        sms: false,
                    },
                    "primary-address": {
                        "street-1": userExists.address,
                        "street-2": userExists.unitApt,
                        "postal-code": userExists.postalCode,
                        city: userExists.city,
                        region: userExists.stateId.name,
                        country: userExists.country,
                    },
                },
            },
        };
        const createAccountData = await (0, utility_1.createAccount)(jwtToken, data);
        const errorResponse = {
            message: "Error in creating account in prime trust",
            data: createAccountData,
        };
        if (createAccountData.status == 400) {
            return this.BadRequest(ctx, errorResponse);
        }
        let frontDocumentId = null;
        let backDocumentId = null;
        let uploadFileError = null;
        try {
            for (var newArrayFiles_1 = __asyncValues(newArrayFiles), newArrayFiles_1_1; newArrayFiles_1_1 = await newArrayFiles_1.next(), !newArrayFiles_1_1.done;) {
                let identificationFile = newArrayFiles_1_1.value;
                let uploadData = {
                    "contact-id": createAccountData.data.included[0].id,
                    description: identificationFile.fieldname == "front_side"
                        ? "Front Side Driving License"
                        : "Back Side Driving License",
                    label: identificationFile.fieldname == "front_side"
                        ? "Front Side Driving License"
                        : "Back Side Driving License",
                    public: "true",
                    file: fs_1.default.createReadStream(path_1.default.join(__dirname, "../../../uploads", identificationFile.filename)),
                };
                let uploadFile = await (0, utility_1.uploadFilesFetch)(jwtToken, uploadData);
                if (uploadFile.status == 400) {
                    uploadFileError = uploadFile.message;
                    break;
                }
                if (uploadFile.status == 200 && uploadFile.message.errors != undefined) {
                    uploadFileError = uploadFile.message;
                    break;
                }
                identificationFile.fieldname == "front_side"
                    ? (frontDocumentId = uploadFile.message.data.id)
                    : (backDocumentId = uploadFile.message.data.id);
                try {
                    fs_1.default.unlinkSync(path_1.default.join(__dirname, "../../../uploads", identificationFile.filename));
                }
                catch (err) {
                    console.log("Error in removing image");
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (newArrayFiles_1_1 && !newArrayFiles_1_1.done && (_a = newArrayFiles_1.return)) await _a.call(newArrayFiles_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (uploadFileError) {
            return this.BadRequest(ctx, uploadFileError);
        }
        const kycData = {
            type: "kyc-document-checks",
            attributes: {
                "contact-id": createAccountData.data.included[0].id,
                "uploaded-document-id": frontDocumentId,
                "backside-document-id": backDocumentId,
                "kyc-document-type": "drivers_license",
                identity: true,
                "identity-photo": true,
                "proof-of-address": true,
                "kyc-document-country": "US",
            },
        };
        let kycResponse = await (0, utility_1.kycDocumentChecks)(jwtToken, kycData);
        if (kycResponse.status == 400) {
            return this.BadRequest(ctx, kycResponse);
        }
        if (kycResponse.status == 200 && kycResponse.data.errors != undefined) {
            return this.BadRequest(ctx, kycResponse);
        }
        await model_1.ParentChildTable.updateOne({ userId: user._id, "teens.childId": parentChildExists.firstChildId }, {
            $set: {
                contactId: createAccountData.data.included[0].id,
                "teens.$.accountId": createAccountData.data.data.id,
                frontDocumentId: frontDocumentId,
                backDocumentId: backDocumentId,
                kycDocumentId: kycResponse.data.data.id,
            },
        });
        return this.Ok(ctx, {
            data: kycResponse,
            message: "Your documents are uploaded successfully. We are currently verifying your documents. Please wait for 24 hours.",
        });
    }
    async testApi(ctx) {
        const { publicToken, accountId } = ctx.request.body;
        const jwtToken = ctx.request.primeTrustToken;
        if (!publicToken || !accountId) {
            return this.BadRequest(ctx, "Public Token or AccountId Doesn't Exists");
        }
        const userExists = await model_1.UserTable.findOne({ _id: ctx.request.user._id }, { _id: 1 });
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
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
        const accountIdDetails = parentDetails.teens.find((x) => x.childId.toString() == parentDetails.firstChildId.toString());
        if (!accountIdDetails) {
            return this.BadRequest(ctx, "Account Details Not Found");
        }
        const publicTokenExchange = await (0, utility_1.getPublicTokenExchange)(publicToken);
        if (publicTokenExchange.status == 400) {
            return this.BadRequest(ctx, publicTokenExchange.message);
        }
        const processToken = await (0, utility_1.createProcessorToken)(publicTokenExchange.data.access_token, accountId);
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
                amount: "50",
            },
        };
        console.log(contributionRequest, "contributionRequest");
        const contributions = await (0, utility_1.createContributions)(jwtToken, contributionRequest);
        if (contributions.status == 400) {
            return this.BadRequest(ctx, contributions);
        }
        return this.Ok(ctx, contributions.data);
    }
    async testApiForWire(ctx) {
        const jwtToken = ctx.request.primeTrustToken;
        const userExists = await model_1.UserTable.findOne({ _id: ctx.request.user._id }, { _id: 1 });
        if (!userExists) {
            return this.BadRequest(ctx, "User Not Found");
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
        const accountIdDetails = parentDetails.teens.find((x) => x.childId.toString() == parentDetails.firstChildId.toString());
        if (!accountIdDetails) {
            return this.BadRequest(ctx, "Account Details Not Found");
        }
        let contributionRequest = {
            type: "contributions",
            attributes: {
                "account-id": accountIdDetails.accountId,
                "contact-id": parentDetails.contactId,
                "funds-transfer-type": "wire",
                amount: "50",
            },
        };
        console.log(contributionRequest, "contributionRequest");
        const contributions = await (0, utility_1.createContributions)(jwtToken, contributionRequest);
        if (contributions.status == 400) {
            return this.BadRequest(ctx, contributions);
        }
        return this.Ok(ctx, contributions.data);
    }
    async getProfile(ctx) {
        let data = (await model_1.UserTable.aggregate([
            { $match: { _id: new mongodb_1.ObjectId(ctx.request.user._id) } },
            {
                $lookup: {
                    from: "states",
                    localField: "stateId",
                    foreignField: "_id",
                    as: "state",
                },
            },
            { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    username: 1,
                    mobile: 1,
                    address: 1,
                    firstName: 1,
                    lastName: 1,
                    type: 1,
                    parentMobile: 1,
                    parentEmail: 1,
                    country: 1,
                    "state._id": 1,
                    "state.name": 1,
                    "state.shortName": 1,
                    city: 1,
                    postalCode: 1,
                    unitApt: 1,
                    liquidAsset: 1,
                    taxIdNo: 1,
                    taxState: 1,
                    dob: 1,
                },
            },
        ]).exec())[0];
        return this.Ok(ctx, data, true);
    }
    async getChildren(ctx) {
        let teens = await model_1.ParentChildTable.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "teens.childId",
                    foreignField: "_id",
                    as: "teens",
                },
            },
            {
                $match: {
                    userId: new mongodb_1.ObjectId(ctx.request.user._id),
                },
            },
            {
                $project: {
                    "teens.firstName": 1,
                    "teens.lastName": 1,
                    "teens.username": 1,
                    "teens._id": 1,
                    _id: 0,
                },
            },
        ]).exec();
        if (teens.length == 0)
            return this.BadRequest(ctx, "No child found");
        teens = teens[0];
        return this.Ok(ctx, teens);
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/update-tax-info", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], UserController.prototype, "updateTaxInfo", null);
__decorate([
    (0, utility_1.Route)({ path: "/get-link-token", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], UserController.prototype, "getLinkToken", null);
__decorate([
    (0, utility_1.Route)({ path: "/agreement-preview", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)(),
    (0, middleware_1.PrimeTrustJWT)()
], UserController.prototype, "sendAgreementPreview", null);
__decorate([
    (0, utility_1.Route)({
        path: "/upload-id-proof",
        method: types_1.HttpMethod.POST,
        middleware: [
            upload.fields([
                {
                    name: "front_side",
                    maxCount: 1,
                },
                { name: "back_side", maxCount: 1 },
            ]),
        ],
    }),
    (0, middleware_1.Auth)(),
    (0, middleware_1.PrimeTrustJWT)()
], UserController.prototype, "uploadFilesData", null);
__decorate([
    (0, utility_1.Route)({ path: "/test-api", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)(),
    (0, middleware_1.PrimeTrustJWT)()
], UserController.prototype, "testApi", null);
__decorate([
    (0, utility_1.Route)({ path: "/test-api-wire", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)(),
    (0, middleware_1.PrimeTrustJWT)()
], UserController.prototype, "testApiForWire", null);
__decorate([
    (0, utility_1.Route)({ path: "/get-profile", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], UserController.prototype, "getProfile", null);
__decorate([
    (0, utility_1.Route)({ path: "/get-children", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], UserController.prototype, "getChildren", null);
exports.default = new UserController();
//# sourceMappingURL=user.js.map