"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18n_1 = __importDefault(require("i18n"));
const path_1 = __importDefault(require("path"));
i18n_1.default.configure({
    locales: ['en'],
    defaultLocale: 'en',
    queryParameter: 'lang',
    directory: path_1.default.join(__dirname, "/"),
});
module.exports = async (ctx, next) => {
    i18n_1.default.init(ctx.request, ctx.response);
    ctx.__ = i18n_1.default.__;
    return next();
};
//# sourceMappingURL=I18n.js.map