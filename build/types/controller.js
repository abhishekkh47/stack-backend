"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpMethod = void 0;
var HttpMethod;
(function (HttpMethod) {
    HttpMethod[HttpMethod["HEAD"] = 1] = "HEAD";
    HttpMethod[HttpMethod["OPTIONS"] = 2] = "OPTIONS";
    HttpMethod[HttpMethod["GET"] = 4] = "GET";
    HttpMethod[HttpMethod["PUT"] = 8] = "PUT";
    HttpMethod[HttpMethod["PATCH"] = 16] = "PATCH";
    HttpMethod[HttpMethod["POST"] = 32] = "POST";
    HttpMethod[HttpMethod["DELETE"] = 64] = "DELETE";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
//# sourceMappingURL=controller.js.map