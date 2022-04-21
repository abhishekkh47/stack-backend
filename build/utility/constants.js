"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DROPDOWNLIST = exports.PLAIDAPIS = exports.PRIMETRUSTAPIS = exports.PRIMETRUSTBASEAPIURL = exports.PRIMETRUSTCONSTANT = exports.CONSTANT = void 0;
exports.CONSTANT = Object.freeze({
    VerifyEmailTemplateId: "d-024fedc867e0407ab4971e642354168f",
    ResetPasswordTemplateId: "d-272f7e39cb4a4220ac7809d64f99e516",
    HelpCenterTemplateId: "d-614d94dc58d6436eb23d17a7757a9da5",
});
exports.PRIMETRUSTCONSTANT = Object.freeze({
    email: "natalie@trystack.io",
    password: "Password123!",
});
exports.PRIMETRUSTBASEAPIURL = "";
exports.PRIMETRUSTAPIS = {
    jwt: "auth/jwts",
    getUser: "v2/users",
    uploadFiles: "v2/uploaded-documents",
    accountCreate: "v2/accounts?include=contacts",
    agreementPreviews: "v2/agreement-previews",
    kycDocumentChecks: "v2/kyc-document-checks",
    createFundTransferMethod: "v2/funds-transfer-methods",
    contributions: "v2/contributions?include=funds-transfer",
    disbursements: "v2/disbursements?include=funds-transfer",
    pushTransfer: "v2/push-transfer-methods",
    wireInbound: (id) => `v2/push-transfer-methods/${id}/sandbox/inbound-wire?include=funds-transfers`,
    getAssets: (page, limit) => `v2/assets?page[size]=${limit}&page[number]=${page}`,
};
exports.PLAIDAPIS = {
    getLinkToken: "link/token/create",
    publicTokenExchange: "item/public_token/exchange",
    createProcessorToken: "processor/token/create",
};
exports.DROPDOWNLIST = {
    page: 1,
    limit: 10,
};
//# sourceMappingURL=constants.js.map