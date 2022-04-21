"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = async (ctx) => {
    if (ctx.path === "/alive") {
        ctx.body = {
            status: "ok",
            timestamp: Date.now(),
        };
        return;
    }
    ctx.status = 404;
    ctx.body = {
        code: 404,
        message: "Requested path not found",
        path: ctx.path,
        success: false,
    };
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=not-found.middleware.js.map