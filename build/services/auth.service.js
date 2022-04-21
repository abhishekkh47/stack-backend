"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("@app/model");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthService {
    async findUserByEmail(email) {
        return await model_1.UserTable.findOne({ email });
    }
    comparePassword(password, input) {
        return bcrypt_1.default.compareSync(password, input);
    }
    encryptPassword(password) {
        return bcrypt_1.default.hashSync(password, 10);
    }
    async updateUserInfo(id, body) {
        return await model_1.UserTable.updateOne({ _id: id }, { $set: body });
    }
    async signupUser(body) {
        return await model_1.UserTable.create({
            email: body.email,
            password: this.encryptPassword(body.password),
            username: body.username,
        });
    }
    getJwtAuthInfo(user) {
        const expiredOn = Date.now() + 36000;
        return {
            _id: user._id,
            issuedOn: Date.now(),
            expiredOn,
            email: user.email,
            username: user.username,
        };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map