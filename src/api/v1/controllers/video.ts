import Koa from "koa";
import mongoose from "mongoose";
import { Route } from "../../../utility";
import BaseController from "./base";
import { Auth } from "../../../middleware";
import { HttpMethod } from "../../../types";
import { VideosTable } from "../../../model/videos";

class VideoController extends BaseController {
  /**
   * @description This method is used to create static videos in db
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-video", method: HttpMethod.POST })
  // @Auth()
  public async addVideos(ctx: Koa.Context) {
    await VideosTable.insertMany(ctx.request.body);
    return this.Ok(ctx, { message: "Success" });
  }

  /**
   * @description This method is used to get videos in video library module
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/generic-reels", method: HttpMethod.GET })
  @Auth()
  public async getVideos(ctx: Koa.Context) {
    let videos: any = await VideosTable.find(
      {},
      {
        videoCategory: 1,
        status: 1,
        data: 1,
      }
    );
    if (videos.length === 0) {
      return this.Ok(ctx, { data: [], message: "Success" });
    }
    return this.Ok(ctx, { data: videos, message: "Success" });
  }
}

export default new VideoController();
