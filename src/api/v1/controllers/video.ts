import Koa from "koa";
import mongoose from "mongoose";
import { Route } from "@app/utility";
import BaseController from "./base";
import { Auth } from "@app/middleware";
import { HttpMethod } from "@app/types";
import { VideosTable } from "@app/model/videos";

class VideoController extends BaseController {
  /**
   * @description This method is used to create static videos in db
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/add-video", method: HttpMethod.POST })
  @Auth()
  public async addVideos(ctx: Koa.Context) {
    await VideosTable.insertMany(ctx.request.body.videoArray);
    return this.Ok(ctx, { message: "Success" });
  }

  /**
   * @description This method is used to get videos in video library module
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/videos", method: HttpMethod.GET })
  @Auth()
  public async getVideos(ctx: Koa.Context) {
    let videos: any = await VideosTable.find(
      {},
      {
        videoTopic: 1,
        status: 1,
        videoList: 1,
      }
    );
    if (videos.length === 0) {
      return this.NotFound(ctx, "Not Found");
    }
    videos = videos.filter((x) => x.videoList.length !== 0);
    return this.Ok(ctx, { data: videos, message: "Success" });
  }
}

export default new VideoController();
