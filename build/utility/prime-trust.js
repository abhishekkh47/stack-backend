"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssets = exports.wireInboundMethod = exports.createPushTransferMethod = exports.createDisbursements = exports.createContributions = exports.createFundTransferMethod = exports.kycDocumentChecks = exports.agreementPreviews = exports.uploadFilesFetch = exports.uploadFiles = exports.createAccount = exports.getUser = exports.getPrimeTrustJWTToken = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = __importDefault(require("../config/index"));
const request_1 = __importDefault(require("request"));
const constants_1 = require("./constants");
const getPrimeTrustJWTToken = async () => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.jwt, {}, {
        auth: {
            username: constants_1.PRIMETRUSTCONSTANT.email,
            password: constants_1.PRIMETRUSTCONSTANT.password,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data.token,
        };
    })
        .catch((error) => {
        if (error) {
            return {
                status: error.response.status,
                message: "Unauthorized",
            };
        }
    });
    return response;
};
exports.getPrimeTrustJWTToken = getPrimeTrustJWTToken;
const getUser = async (token) => {
    const response = await axios_1.default
        .get(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.getUser, {
        headers: { Authorization: `Bearer ${token}` },
    })
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
                message: "Unauthorized",
            };
        }
    });
    return response;
};
exports.getUser = getUser;
const createAccount = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.accountCreate, { data: data }, {
        headers: { Authorization: `Bearer ${token}` },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data,
        };
    });
    return response;
};
exports.createAccount = createAccount;
const uploadFiles = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.uploadFiles, { data: data }, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data,
        };
    });
    return response;
};
exports.uploadFiles = uploadFiles;
const uploadFilesFetch = async (token, data) => {
    const options = {
        method: "POST",
        url: index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.uploadFiles,
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data",
        },
        formData: data,
    };
    return new Promise((resolve, reject) => {
        const response = (0, request_1.default)(options, function (err, res, body) {
            if (err) {
                return reject({
                    status: 400,
                    message: err,
                });
            }
            return resolve({
                status: 200,
                message: JSON.parse(res.body),
            });
        });
    });
};
exports.uploadFilesFetch = uploadFilesFetch;
const agreementPreviews = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.agreementPreviews, { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data,
        };
    });
    return response;
};
exports.agreementPreviews = agreementPreviews;
const kycDocumentChecks = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.kycDocumentChecks, { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data,
        };
    });
    return response;
};
exports.kycDocumentChecks = kycDocumentChecks;
const createFundTransferMethod = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.createFundTransferMethod, { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data,
        };
    });
    return response;
};
exports.createFundTransferMethod = createFundTransferMethod;
const createContributions = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.contributions, { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data.errors[0].detail,
        };
    });
    return response;
};
exports.createContributions = createContributions;
const createDisbursements = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.disbursements, { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data.errors[0].detail,
        };
    });
    return response;
};
exports.createDisbursements = createDisbursements;
const createPushTransferMethod = async (token, data) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.pushTransfer, { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data.errors[0].detail,
        };
    });
    return response;
};
exports.createPushTransferMethod = createPushTransferMethod;
const wireInboundMethod = async (token, data, id) => {
    const response = await axios_1.default
        .post(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.wireInbound(id), { data: data }, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data.errors[0].detail,
        };
    });
    return response;
};
exports.wireInboundMethod = wireInboundMethod;
const getAssets = async (token, page, number) => {
    const response = await axios_1.default
        .get(index_1.default.PRIMETRUSTAPI_URL + constants_1.PRIMETRUSTAPIS.getAssets(page, number), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => {
        return {
            status: 200,
            data: res.data,
        };
    })
        .catch((error) => {
        return {
            status: 400,
            message: error.response.data.errors[0].detail,
        };
    });
    return response;
};
exports.getAssets = getAssets;
//# sourceMappingURL=prime-trust.js.map