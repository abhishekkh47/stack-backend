"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("@app/utility");
const base_1 = __importDefault(require("./base"));
const middleware_1 = require("@app/middleware");
const types_1 = require("@app/types");
const videos_1 = require("@app/model/videos");
class VideoController extends base_1.default {
    async addVideos(ctx) {
        await videos_1.VideosTable.insertMany(ctx.request.body.videoArray);
        return this.Ok(ctx, { message: "Success" });
    }
    async getVideos(ctx) {
        let videos = await videos_1.VideosTable.find({}, {
            videoCategory: 1,
            status: 1,
            videoList: 1,
        });
        if (videos.length === 0) {
            return this.Ok(ctx, { data: [], message: "Success" });
        }
        videos = videos.filter((x) => x.videoList.length !== 0);
        return this.Ok(ctx, { data: videos, message: "Success" });
    }
}
__decorate([
    (0, utility_1.Route)({ path: "/add-video", method: types_1.HttpMethod.POST }),
    (0, middleware_1.Auth)()
], VideoController.prototype, "addVideos", null);
__decorate([
    (0, utility_1.Route)({ path: "/videos", method: types_1.HttpMethod.GET }),
    (0, middleware_1.Auth)()
], VideoController.prototype, "getVideos", null);
exports.default = new VideoController();
//# sourceMappingURL=video.js.map