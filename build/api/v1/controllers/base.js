"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseController {
    constructor() {
        this.routes = [];
        if (this.decoratorRoutes && this.decoratorRoutes.length) {
            Array.prototype.push.apply(this.routes, this.decoratorRoutes);
        }
    }
    Ok(ctx, data, flag = null) {
        ctx.status = 200;
        ctx.body = flag ? { data, status: 200 } : Object.assign(Object.assign({}, data), { status: 200 });
    }
    Created(ctx, data) {
        ctx.status = 201;
        ctx.body = Object.assign(Object.assign({}, data), { status: 201 });
    }
    NoContent(ctx) {
        ctx.status = 203;
        ctx.body = {};
    }
    NotFound(ctx, message) {
        ctx.throw(404, { status: 404, message: message || "Not found" });
    }
    BadRequest(ctx, message) {
        ctx.throw(400, { status: 400, message: message || "Bad request" });
    }
    UnAuthorized(ctx, message) {
        ctx.throw(401, { status: 401, message: message || "Unauthorized" });
    }
}
exports.default = BaseController;
//# sourceMappingURL=base.js.map