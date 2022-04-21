"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const types_1 = require("@app/types");
function Route(path, method = types_1.HttpMethod.GET, ...middleware) {
    return (target, key, descriptor) => {
        if (!target.decoratorRoutes) {
            target.decoratorRoutes = [];
        }
        let order;
        if (typeof path === "object") {
            method = path.method || types_1.HttpMethod.GET;
            middleware = path.middleware
                ? Array.isArray(path.middleware)
                    ? path.middleware
                    : [path.middleware]
                : [];
            order = path.order;
            path = path.path;
        }
        target.decoratorRoutes.push({
            method,
            path,
            handler: descriptor.value.bind(target),
            middleware,
            order,
        });
    };
}
exports.Route = Route;
//# sourceMappingURL=route.js.map