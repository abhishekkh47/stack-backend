"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimeTrustJWT = void 0;
const model_1 = require("@app/model");
const utility_1 = require("@app/utility");
const PrimeTrustJWT = () => {
    return (_, __, descriptor) => {
        const fn = descriptor.value;
        descriptor.value = async function (ctx) {
            const admin = await model_1.AdminTable.findOne({});
            const isJwtValid = await (0, utility_1.getUser)(admin.jwtToken);
            let token = admin.jwtToken;
            if (isJwtValid.status != 200) {
                token = await (0, utility_1.getPrimeTrustJWTToken)();
                await model_1.AdminTable.updateOne({ _id: admin._id }, {
                    $set: {
                        jwtToken: token.data,
                    },
                });
            }
            ctx.request.primeTrustToken = token;
            return await fn.apply(this, [ctx]);
        };
    };
};
exports.PrimeTrustJWT = PrimeTrustJWT;
//# sourceMappingURL=primeTrust.middleware.js.map