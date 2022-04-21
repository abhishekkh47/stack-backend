"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProcessorToken = exports.getPublicTokenExchange = exports.getLinkToken = void 0;
const config_1 = __importDefault(require("@app/config"));
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
let request = {
    client_id: config_1.default.PLAID_CLIENT_ID,
    secret: config_1.default.PLAID_SECRET,
};
const getLinkToken = async (userData) => {
    const clientUserId = userData._id;
    const request = {
        client_id: config_1.default.PLAID_CLIENT_ID,
        secret: config_1.default.PLAID_SECRET,
        user: {
            client_user_id: clientUserId,
        },
        client_name: userData.firstName + " " + userData.lastName,
        products: ["auth"],
        language: "en",
        country_codes: ["US"],
    };
    const response = await axios_1.default
        .post(config_1.default.PLAID_ENV + constants_1.PLAIDAPIS.getLinkToken, request)
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        if (error) {
            return {
                status: error.response.status,
                message: error.response.data.error_message,
            };
        }
    });
    return response;
};
exports.getLinkToken = getLinkToken;
const getPublicTokenExchange = async (publicToken) => {
    const request = {
        client_id: config_1.default.PLAID_CLIENT_ID,
        secret: config_1.default.PLAID_SECRET,
        public_token: publicToken,
    };
    const response = await axios_1.default
        .post(config_1.default.PLAID_ENV + constants_1.PLAIDAPIS.publicTokenExchange, request)
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        if (error) {
            return {
                status: error.response.status,
                message: error.response.data.error_message,
            };
        }
    });
    return response;
};
exports.getPublicTokenExchange = getPublicTokenExchange;
const createProcessorToken = async (accessToken, accountId) => {
    const request = {
        client_id: config_1.default.PLAID_CLIENT_ID,
        secret: config_1.default.PLAID_SECRET,
        access_token: accessToken,
        account_id: accountId,
        processor: "prime_trust",
    };
    const response = await axios_1.default
        .post(config_1.default.PLAID_ENV + constants_1.PLAIDAPIS.createProcessorToken, request)
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        if (error) {
            return {
                status: error.response.status,
                message: error.response.data.error_message,
            };
        }
    });
    return response;
};
exports.createProcessorToken = createProcessorToken;
//# sourceMappingURL=plaid.js.map