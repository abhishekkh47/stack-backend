"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const utility_1 = require("@app/utility");
const Auth = () => {
    return (_, __, descriptor) => {
        const fn = descriptor.value;
        descriptor.value = async function (ctx) {
            const token = ctx.request.headers["x-access-token"] ||
                ctx.request.query.token;
            if (!token) {
                return this.UnAuthorized(ctx, "Invalid JWT Token");
            }
            try {
                const response = await (0, utility_1.verifyToken)(token);
                ctx.request.user = response;
            }
            catch (err) {
                return this.UnAuthorized(ctx, "Invalid JWT Token");
            }
            return await fn.apply(this, [ctx]);
        };
    };
};
exports.Auth = Auth;
//# sourceMappingURL=auth.middleware.js.map