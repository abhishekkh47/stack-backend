import Koa from "koa";
import { Route } from "../../../utility";
import BaseController from "./base";
import { Auth } from "../../../middleware";
import { HttpMethod } from "../../../types";
import { VideosTable } from "../../../model/videos";

class VideoController extends BaseController {
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
        createdAt: 1,
      }
    ).sort({ createdAt: 1 });
    if (videos.length === 0) {
      return this.Ok(ctx, { data: [], message: "Success" });
    }
    return this.Ok(ctx, { data: videos, message: "Success" });
  }
}

export default new VideoController();
