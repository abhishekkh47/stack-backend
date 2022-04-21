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
const types_1 = require("@app/types");
const services_1 = require("@app/services");
const middleware_1 = require("@app/middleware");
const apiValidation_1 = require("@app/validations/apiValidation");
const model_1 = require("@app/model");
const services_2 = require("@app/services");
const moment_1 = __importDefault(require("moment"));
const constants_1 = require("../../../utility/constants");
const userbalance_1 = require("@app/model/userbalance");
const _1 = require(".");
class AliveController extends base_1.default {
    async handleLogin(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.loginValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const { username, email } = reqParam;
                if (!username && !email) {
                    return this.BadRequest(ctx, "Please enter either username or email");
                }
                const resetPasswordMessage = `For your protection, we have reset your password due to insufficient login attempts. Check your email/SMS for a temporary password.`;
                let userExists = await model_1.UserTable.findOne({
                    username,
                });
                if (!userExists) {
                    userExists = await model_1.UserTable.findOne({
                        email,
                    });
                    if (!userExists) {
                        return this.BadRequest(ctx, "User Not Found");
                    }
                }
                if (userExists.loginAttempts < types_1.ALLOWED_LOGIN_ATTEMPTS - 1) {
                    if (!services_1.AuthService.comparePassword(ctx.request.body.password, userExists.password)) {
                        if (userExists.loginAttempts < types_1.ALLOWED_LOGIN_ATTEMPTS - 1) {
                            userExists.loginAttempts = userExists.loginAttempts + 1;
                            await userExists.save();
                        }
                        return this.UnAuthorized(ctx, "Invalid password");
                    }
                    await model_1.UserTable.updateOne({ _id: userExists._id }, { $set: { loginAttempts: 0, tempPassword: null } });
                    const authInfo = services_1.AuthService.getJwtAuthInfo(userExists);
                    const token = (0, utility_1.getJwtToken)(authInfo);
                    const refreshToken = (0, utility_1.getRefreshToken)(authInfo);
                    userExists.refreshToken = refreshToken;
                    await userExists.save();
                    let getProfileInput = {
                        request: {
                            query: { token },
                            headers: {},
                        },
                    };
                    await _1.UserController.getProfile(getProfileInput);
                    return this.Ok(ctx, {
                        token,
                        refreshToken,
                        profileData: getProfileInput.body.data,
                    });
                }
                else {
                    userExists.loginAttempts = userExists.loginAttempts + 1;
                    await userExists.save();
                    const requestData = {
                        request: {
                            body: {
                                username: userExists.username,
                            },
                        },
                    };
                    await this.resetPassword(requestData);
                    return this.BadRequest(ctx, resetPasswordMessage);
                }
            }
        });
    }
    async handleSignup(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.signupValidation(reqParam, ctx, async (validate) => {
            var e_1, _a;
            if (validate) {
                let childExists = null;
                const childArray = [];
                let user = await services_1.AuthService.findUserByEmail(reqParam.email);
                if (user) {
                    return this.UnAuthorized(ctx, "Email Already Exists");
                }
                user = await model_1.UserTable.findOne({ mobile: reqParam.mobile });
                if (user) {
                    return this.UnAuthorized(ctx, "Mobile Number already Exists");
                }
                if (reqParam.type == types_1.EUserType.TEEN) {
                    user = await model_1.UserTable.findOne({
                        email: reqParam.parentEmail,
                        type: types_1.EUserType.TEEN,
                    });
                    if (user) {
                        return this.UnAuthorized(ctx, "Email Already Exists");
                    }
                    user = await model_1.UserTable.findOne({
                        mobile: reqParam.parentMobile,
                        type: types_1.EUserType.TEEN,
                    });
                    if (user) {
                        return this.UnAuthorized(ctx, "Mobile Number Already Exists");
                    }
                    const message = `Hello Your teen ${reqParam.username} has invited you to join Stack. Please start the onboarding as soon as possible.`;
                    try {
                        const twilioResponse = await services_2.TwilioService.sendSMS(reqParam.parentMobile, message);
                        if (twilioResponse.code === 400) {
                            return this.BadRequest(ctx, "Error in sending OTP");
                        }
                    }
                    catch (error) {
                        return this.BadRequest(ctx, error.message);
                    }
                }
                else {
                    const parentEmailExistInChild = await model_1.UserTable.findOne({
                        parentEmail: reqParam.email,
                    });
                    const parentMobileExistInChild = await model_1.UserTable.findOne({
                        parentMobile: reqParam.mobile,
                    });
                    if (!parentEmailExistInChild || !parentMobileExistInChild) {
                        return this.BadRequest(ctx, "Sorry , We cannot find this email/mobile in teen.");
                    }
                    childExists = await model_1.UserTable.findOne({
                        mobile: reqParam.childMobile,
                    });
                    if (!childExists) {
                        return this.BadRequest(ctx, "Teen Mobile Number Doesn't Exists");
                    }
                    if (childExists.parentMobile !== reqParam.mobile ||
                        childExists.parentEmail !== reqParam.email) {
                        return this.BadRequest(ctx, "Sorry We cannot find your accounts. Unable to link them");
                    }
                    if (reqParam.fileTaxesInUS == 0 || reqParam.citizenOfUS == 0) {
                        return this.BadRequest(ctx, "Sorry We are only serving US Based Citizens right now but we do plan to expand. Stay Tuned!!");
                    }
                    if (reqParam.type == types_1.EUserType.PARENT &&
                        new Date(Date.now() - new Date(reqParam.dob).getTime()).getFullYear() < 1988) {
                        return this.BadRequest(ctx, "Parent's age should be 18+");
                    }
                    const childDetails = await model_1.UserTable.find({
                        type: types_1.EUserType.TEEN,
                        parentEmail: reqParam.email,
                        parentMobile: reqParam.mobile,
                    }, {
                        _id: 1,
                    });
                    if (childDetails.length == 0) {
                        return this.BadRequest(ctx, "Teen Mobile Number Doesn't Exists");
                    }
                    try {
                        for (var childDetails_1 = __asyncValues(childDetails), childDetails_1_1; childDetails_1_1 = await childDetails_1.next(), !childDetails_1_1.done;) {
                            const child = childDetails_1_1.value;
                            await childArray.push({ childId: child._id, accountId: null });
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (childDetails_1_1 && !childDetails_1_1.done && (_a = childDetails_1.return)) await _a.call(childDetails_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                if (reqParam.username) {
                    user = await model_1.UserTable.findOne({ username: reqParam.username });
                    if (user) {
                        return this.UnAuthorized(ctx, "Username already Exists");
                    }
                }
                reqParam.password = services_1.AuthService.encryptPassword(reqParam.password);
                user = await model_1.UserTable.create({
                    username: reqParam.username,
                    password: reqParam.password,
                    email: reqParam.email ? reqParam.email : null,
                    type: reqParam.type,
                    firstName: reqParam.firstName,
                    lastName: reqParam.lastName,
                    mobile: reqParam.mobile,
                    parentEmail: reqParam.parentEmail ? reqParam.parentEmail : null,
                    parentMobile: reqParam.parentMobile ? reqParam.parentMobile : null,
                    dob: reqParam.dob ? reqParam.dob : null,
                });
                await userbalance_1.UserWalletTable.create({
                    userId: user._id,
                    balance: 0,
                });
                if (user.type === types_1.EUserType.PARENT) {
                    console.log("added");
                    await model_1.ParentChildTable.create({
                        userId: user._id,
                        contactId: null,
                        firstChildId: childExists._id,
                        teens: childArray,
                    });
                }
                const authInfo = services_1.AuthService.getJwtAuthInfo(user);
                const refreshToken = (0, utility_1.getRefreshToken)(authInfo);
                user.refreshToken = refreshToken;
                await user.save();
                const token = (0, utility_1.getJwtToken)(authInfo);
                return this.Ok(ctx, {
                    token,
                    refreshToken,
                    message: reqParam.type == types_1.EUserType.TEEN
                        ? `We have sent sms/email to your parent. Once he starts onboarding process you can have access to full features of this app.`
                        : `Your account is created successfully. Please fill other profile details as well.`,
                });
            }
        });
    }
    async handleTokenLogin(ctx) {
        const token = ctx.request.body.token;
        if (!token) {
            return this.BadRequest(ctx, "Token required");
        }
        const authInfo = (0, utility_1.verifyToken)(token);
        const user = await services_1.AuthService.findUserByEmail(authInfo.email);
        if (!user) {
            return this.UnAuthorized(ctx, "User not found");
        }
        return this.Ok(ctx, user);
    }
    async changePassword(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        const userExists = await model_1.UserTable.findOne({ _id: user._id });
        if (!reqParam.old_password) {
            return this.BadRequest(ctx, "Please enter old password");
        }
        const checkOldPassword = await services_1.AuthService.comparePassword(reqParam.old_password, userExists.password);
        if (checkOldPassword === false) {
            return this.BadRequest(ctx, "Old Password is Incorrect");
        }
        return apiValidation_1.validation.changePasswordValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                return model_1.UserTable.findOne({ _id: user._id }).then(async (userData) => {
                    if (!userData) {
                        return this.NotFound(ctx, "User Not Found");
                    }
                    const compareNewPasswordWithOld = await services_1.AuthService.comparePassword(reqParam.new_password, userData.password);
                    if (compareNewPasswordWithOld === true) {
                        return this.BadRequest(ctx, "New Password should not be similiar to Old Password");
                    }
                    const newPassword = await services_1.AuthService.encryptPassword(reqParam.new_password);
                    await model_1.UserTable.updateOne({ _id: user._id }, {
                        $set: {
                            password: newPassword,
                        },
                    });
                    return this.Ok(ctx, { message: "Password Changed Successfully" });
                });
            }
        });
    }
    changeAddress(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.changeAddressValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                await model_1.UserTable.updateOne({ _id: user._id }, { $set: { address: reqParam.address } });
                return this.Ok(ctx, { message: "Address Changed Successfully" });
            }
        });
    }
    async changeEmail(ctx) {
        const user = ctx.request.user;
        const reqParam = ctx.request.body;
        const userExists = await model_1.UserTable.findOne({ id: user.id });
        if (!userExists) {
            return this.BadRequest(ctx, "User not found");
        }
        const userData = await model_1.UserTable.findOne({ email: reqParam.email });
        if (userData !== null) {
            return this.BadRequest(ctx, "You cannot add same email address");
        }
        if (userExists.type === types_1.EUserType.TEEN) {
            const parentEmailExists = await model_1.UserTable.findOne({
                parentMobile: reqParam.email,
            });
            if (parentEmailExists) {
                return this.BadRequest(ctx, "You cannot add same email address as in parent");
            }
        }
        return apiValidation_1.validation.changeEmailValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                try {
                    const verificationCode = await (0, utility_1.hashString)(10);
                    const expiryTime = (0, moment_1.default)().add(24, "hours").unix();
                    const data = {
                        subject: "Verify Email",
                        verificationCode,
                        link: `${process.env.URL}/api/v1/verify-email?verificationCode=${verificationCode}&email=${reqParam.email}`,
                    };
                    await (0, utility_1.sendEmail)(reqParam.email, constants_1.CONSTANT.VerifyEmailTemplateId, data);
                    await model_1.UserTable.updateOne({ _id: user._id }, {
                        $set: {
                            verificationEmailExpireAt: expiryTime,
                            verificationCode,
                        },
                    });
                    return this.Ok(ctx, {
                        message: "Verification email is sent to you. Please check the email.",
                    });
                }
                catch (e) {
                    throw new Error(e.message);
                }
            }
        });
    }
    async verifyEmail(ctx) {
        const verificationCode = ctx.query.verificationCode;
        try {
            const userData = await model_1.UserTable.findOne({ verificationCode });
            if (userData) {
                if (userData.verificationEmailExpireAt > (0, moment_1.default)().unix().toString()) {
                    await model_1.UserTable.updateOne({ _id: userData._id }, {
                        $set: {
                            verificationEmailExpireAt: null,
                            verificationCode: "",
                            email: ctx.query.email,
                        },
                    });
                    await ctx.render("message.pug", {
                        message: "Email has been verified successfully",
                        type: "Success",
                    });
                }
                else {
                    await ctx.render("message.pug", {
                        message: "Link has Expired.",
                        type: "Error",
                    });
                }
            }
            else {
                await ctx.render("message.pug", {
                    message: "Link has Expired.",
                    type: "Error",
                });
            }
        }
        catch (e) {
            throw new Error(e.message);
        }
    }
    changeMobile(ctx) {
        const reqParam = ctx.request.body;
        const user = ctx.request.user;
        return apiValidation_1.validation.changeMobileNumberValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const userExists = await model_1.UserTable.findOne({ _id: user._id });
                if (!userExists) {
                    return this.BadRequest(ctx, "User Not Found");
                }
                const checkCellNumberExists = await model_1.UserTable.findOne({
                    mobile: reqParam.mobile,
                });
                if (checkCellNumberExists) {
                    return this.BadRequest(ctx, "Cell Number Already Exists.");
                }
                if (userExists.type === types_1.EUserType.TEEN) {
                    const parentMobileExists = await model_1.UserTable.findOne({
                        parentMobile: reqParam.mobile,
                    });
                    if (parentMobileExists) {
                        return this.BadRequest(ctx, "Cell Number Already Exists in Parent.");
                    }
                }
                const code = (0, utility_1.generateRandom6DigitCode)(true);
                const message = `Your verification code is ${code}. Please don't share it with anyone.`;
                const twilioResponse = await services_2.TwilioService.sendSMS(reqParam.mobile, message);
                if (twilioResponse.code === 400) {
                    return this.BadRequest(ctx, "Error in sending OTP");
                }
                await model_1.OtpTable.create({
                    message,
                    code,
                    receiverMobile: reqParam.mobile,
                    type: types_1.EOTPTYPE.CHANGE_MOBILE,
                });
                return this.Ok(ctx, {
                    message: "We have sent you code in order to proceed your request of changing cell number. Please check your phone.",
                });
            }
        });
    }
    verifyOtp(ctx) {
        const reqParam = ctx.request.body;
        const user = ctx.request.user;
        return apiValidation_1.validation.verifyOtpValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const otpExists = await model_1.OtpTable.findOne({
                    receiverMobile: reqParam.mobile,
                }).sort({ createdAt: -1 });
                if (!otpExists) {
                    return this.BadRequest(ctx, "Mobile Number Not Found");
                }
                if (otpExists.isVerified === types_1.EOTPVERIFICATION.VERIFIED) {
                    return this.BadRequest(ctx, "Mobile Number Already Verified");
                }
                const checkMinutes = await (0, utility_1.getMinutesBetweenDates)(new Date(otpExists.createdAt), new Date());
                if (checkMinutes > 5) {
                    return this.BadRequest(ctx, "Otp Time Limit Expired. Please resend otp and try to submit it within 5 minutes.");
                }
                if (otpExists.code != reqParam.code) {
                    return this.BadRequest(ctx, "Code Doesn't Match");
                }
                await model_1.UserTable.updateOne({ _id: user._id }, { $set: { mobile: reqParam.mobile } });
                await model_1.OtpTable.updateOne({ _id: otpExists._id }, { $set: { isVerified: types_1.EOTPVERIFICATION.VERIFIED } });
                return this.Ok(ctx, {
                    message: "Your mobile number is changed successfully",
                });
            }
        });
    }
    verifyOtpSignUp(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.verifyOtpValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const otpExists = await model_1.OtpTable.findOne({
                    receiverMobile: reqParam.mobile,
                }).sort({ createdAt: -1 });
                if (!otpExists) {
                    return this.BadRequest(ctx, "Mobile Number Not Found");
                }
                if (otpExists.isVerified === types_1.EOTPVERIFICATION.VERIFIED) {
                    return this.BadRequest(ctx, "Mobile Number Already Verified");
                }
                const checkMinutes = await (0, utility_1.getMinutesBetweenDates)(new Date(otpExists.createdAt), new Date());
                if (checkMinutes > 5) {
                    return this.BadRequest(ctx, "Otp Time Limit Expired. Please resend otp and try to submit it within 5 minutes.");
                }
                if (otpExists.code != reqParam.code) {
                    return this.BadRequest(ctx, "Code Doesn't Match");
                }
                await model_1.OtpTable.updateOne({ _id: otpExists._id }, { $set: { isVerified: types_1.EOTPVERIFICATION.VERIFIED } });
                return this.Ok(ctx, {
                    message: "Your mobile number is verified successfully",
                });
            }
        });
    }
    resendOtp(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.changeMobileNumberValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const code = (0, utility_1.generateRandom6DigitCode)(true);
                const message = `Your verification code is ${code}. Please don't share it with anyone.`;
                try {
                    const twilioResponse = await services_2.TwilioService.sendSMS(reqParam.mobile, message);
                    if (twilioResponse.code === 400) {
                        return this.BadRequest(ctx, "Error in sending OTP");
                    }
                }
                catch (error) {
                    return this.BadRequest(ctx, error);
                }
                await model_1.OtpTable.create({
                    message,
                    code,
                    receiverMobile: reqParam.mobile,
                    type: types_1.EOTPTYPE.CHANGE_MOBILE,
                });
                return this.Ok(ctx, {
                    message: "We have sent you code in order to proceed your request of changing cell number. Please check your phone.",
                });
            }
        });
    }
    async confirmMobileNumber(ctx) {
        const input = ctx.request.body;
        return apiValidation_1.validation.confirmMobileNumberValidation(input, ctx, async (validate) => {
            if (validate) {
                const { mobile, email } = input;
                let user = await model_1.UserTable.findOne({ mobile });
                if (user)
                    return this.BadRequest(ctx, "Mobile number already exists.");
                user = await model_1.UserTable.findOne({ email });
                if (user)
                    return this.BadRequest(ctx, "Email-ID already exists.");
                const code = (0, utility_1.generateRandom6DigitCode)(true);
                const message = `Your verification code is ${code}. Please don't share it with anyone.`;
                try {
                    const twilioResponse = await services_2.TwilioService.sendSMS(mobile, message);
                    if (twilioResponse.code === 400) {
                        return this.BadRequest(ctx, "Error in sending OTP");
                    }
                    await model_1.OtpTable.create({
                        message,
                        code,
                        receiverMobile: mobile,
                        type: types_1.EOTPTYPE.SIGN_UP,
                    });
                    return this.Ok(ctx, {
                        message: "We have sent you code in order to proceed your request of confirming mobile number. Please check your phone.",
                    });
                }
                catch (error) {
                    return this.BadRequest(ctx, error.message);
                }
            }
        });
    }
    async checkUserNameExistsInDb(ctx) {
        const reqParam = ctx.params;
        return apiValidation_1.validation.checkUniqueUserNameValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const usernameExists = await model_1.UserTable.findOne({
                    username: reqParam.username,
                });
                if (usernameExists) {
                    return this.BadRequest(ctx, "UserName already Exists");
                }
                return this.Ok(ctx, { message: "UserName is available" });
            }
        });
    }
    async resetPassword(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.checkUniqueUserNameValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const userExists = await model_1.UserTable.findOne({
                    username: reqParam.username,
                });
                if (!userExists) {
                    return this.BadRequest(ctx, "User not found");
                }
                const tempPassword = (0, utility_1.generateTempPassword)(userExists.username);
                const message = `Your temporary password is ${tempPassword}. Please don't share it with anyone.`;
                const data = {
                    message: tempPassword,
                    subject: "Reset Password",
                };
                if (userExists.mobile) {
                    const twilioResponse = await services_2.TwilioService.sendSMS(userExists.mobile, message);
                    if (twilioResponse.code === 400) {
                        return this.BadRequest(ctx, "Error in sending temporary password");
                    }
                }
                if (userExists.email) {
                    await (0, utility_1.sendEmail)(userExists.email, constants_1.CONSTANT.ResetPasswordTemplateId, data);
                }
                const newPassword = await services_1.AuthService.encryptPassword(tempPassword);
                await model_1.UserTable.updateOne({ _id: userExists._id }, { $set: { tempPassword: newPassword } });
                return this.Ok(ctx, {
                    message: "Please check your email/sms for temporary password.",
                });
            }
        });
    }
    async updateNewPassword(ctx) {
        const reqParam = ctx.request.body;
        return apiValidation_1.validation.updateNewPasswordValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const userExists = await model_1.UserTable.findOne({
                    username: reqParam.username,
                });
                if (!userExists) {
                    return this.BadRequest(ctx, "User not found");
                }
                if (!services_1.AuthService.comparePassword(reqParam.tempPassword, userExists.tempPassword)) {
                    return this.BadRequest(ctx, "Incorrect Temporary Password");
                }
                const newPassword = await services_1.AuthService.encryptPassword(reqParam.new_password);
                await model_1.UserTable.updateOne({ _id: userExists._id }, {
                    $set: {
                        password: newPassword,
                        tempPassword: null,
                        loginAttempts: 0,
                    },
                });
                return this.Ok(ctx, { message: "Password Changed Successfully." });
            }
        });
    }
    async checkAccountReadyToLink(ctx) {
        const input = ctx.request.body;
        return apiValidation_1.validation.checkAccountReadyToLinkValidation(input, ctx, async (validate) => {
            if (validate) {
                const { mobile, childMobile, email, childEmail } = input;
                let user = await model_1.UserTable.findOne({
                    mobile: childMobile,
                    parentMobile: mobile,
                    email: childEmail,
                    parentEmail: email,
                });
                if (user)
                    return this.Ok(ctx, { message: "Success" });
                return this.BadRequest(ctx, "We cannot find your accounts");
            }
        });
    }
    async getStates(ctx) {
        const states = await model_1.StateTable.find({});
        this.Ok(ctx, { data: states });
    }
    async storeUserDetails(ctx) {
        const input = ctx.request.body;
        return apiValidation_1.validation.storeUserDetailsValidation(input, ctx, async (validate) => {
            if (validate) {
                const state = await model_1.StateTable.findOne({ _id: input.stateId });
                if (!state)
                    return this.BadRequest(ctx, "Invalid State ID.");
                try {
                    await model_1.UserTable.findOneAndUpdate({ username: ctx.request.user.username }, { $set: input });
                    return this.Created(ctx, {
                        message: "Stored Address and Liquid Asset Information Successfully",
                    });
                }
                catch (error) {
                    this.BadRequest(ctx, "Something went wrong. Please try again.");
                }
            }
        });
    }
    async refreshToken(ctx) {
        const input = ctx.request.body;
        const { refreshToken } = input;
        if (!refreshToken || refreshToken == "")
            return this.BadRequest(ctx, "Refresh Token not found.");
        let user;
        try {
            user = (0, utility_1.verifyToken)(refreshToken);
        }
        catch (error) {
            return this.UnAuthorized(ctx, "Refresh Token Expired");
        }
        let actualRefreshToken = (await model_1.UserTable.findOne({ username: user.username }, { refreshToken: 1 })).refreshToken;
        if (refreshToken !== actualRefreshToken)
            return this.BadRequest(ctx, "Invalid Refresh Token");
        let token = (0, utility_1.getJwtToken)(services_1.AuthService.getJwtAuthInfo(user));
        this.Ok(ctx, { token });
    }
    async checkEmailExistsInDB(ctx) {
        const reqParam = ctx.params;
        return apiValidation_1.validation.checkUniqueEmailValidation(reqParam, ctx, async (validate) => {
            if (validate) {
                const emailExists = await model_1.UserTable.findOne({
                    email: reqParam.email,
                });
                if (emailExists)
                    return this.BadRequest(ctx, "This email already exists");
                return this.Ok(ctx, { message: "Email-ID is available" });
            }
        });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/login", method: types_1.HttpMethod.POST })
], AliveController.prototype, "handleLogin", null);
__decorate([
    (0, utility_1.Route)({ path: "/signup", method: types_1.HttpMethod.POST })
], AliveController.prototype, "handleSignup", null);
__decorate([
    (0, utility_1.Route)({ path: "/token-login", method: types_1.HttpMethod.POST })
], AliveController.prototype, "handleTokenLogin", null);
__decorate([
    (0, utility_1.Route)({ path: "/change-password", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "changePassword", null);
__decorate([
    (0, utility_1.Route)({ path: "/change-address", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "changeAddress", null);
__decorate([
    (0, utility_1.Route)({ path: "/change-email", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "changeEmail", null);
__decorate([
    (0, utility_1.Route)({ path: "/verify-email", method: types_1.HttpMethod.GET })
], AliveController.prototype, "verifyEmail", null);
__decorate([
    (0, utility_1.Route)({ path: "/change-cell-no", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "changeMobile", null);
__decorate([
    (0, utility_1.Route)({ path: "/verify-otp", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "verifyOtp", null);
__decorate([
    (0, utility_1.Route)({ path: "/verify-otp-signup", method: types_1.HttpMethod.POST })
], AliveController.prototype, "verifyOtpSignUp", null);
__decorate([
    (0, utility_1.Route)({ path: "/resend-otp", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "resendOtp", null);
__decorate([
    (0, utility_1.Route)({ path: "/confirm-mobile-number", method: types_1.HttpMethod.POST })
], AliveController.prototype, "confirmMobileNumber", null);
__decorate([
    (0, utility_1.Route)({ path: "/check-username/:username", method: types_1.HttpMethod.GET })
], AliveController.prototype, "checkUserNameExistsInDb", null);
__decorate([
    (0, utility_1.Route)({ path: "/reset-password", method: types_1.HttpMethod.POST })
], AliveController.prototype, "resetPassword", null);
__decorate([
    (0, utility_1.Route)({ path: "/update-new-password", method: types_1.HttpMethod.POST })
], AliveController.prototype, "updateNewPassword", null);
__decorate([
    (0, utility_1.Route)({ path: "/check-account-ready-to-link", method: types_1.HttpMethod.POST })
], AliveController.prototype, "checkAccountReadyToLink", null);
__decorate([
    (0, utility_1.Route)({ path: "/get-states", method: types_1.HttpMethod.GET })
], AliveController.prototype, "getStates", null);
__decorate([
    (0, utility_1.Route)({ path: "/store-user-details", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "storeUserDetails", null);
__decorate([
    (0, utility_1.Route)({ path: "/refresh-token", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], AliveController.prototype, "refreshToken", null);
__decorate([
    (0, utility_1.Route)({ path: "/check-email/:email", method: types_1.HttpMethod.GET })
], AliveController.prototype, "checkEmailExistsInDB", null);
exports.default = new AliveController();
//# sourceMappingURL=auth.js.map