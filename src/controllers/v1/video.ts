import Koa from "koa";
import { Auth } from "@app/middleware";
import { VideosTable } from "@app/model";
import { HttpMethod } from "@app/types";
import { Route } from "@app/utility";
import BaseController from "@app/controllers/base";

class VideoController extends BaseController {
  /**
   * @description This method is used to get videos in video library module
   * @param ctx
   * @returns {*}
   */
  @Route({ path: "/generic-reels", method: HttpMethod.GET })
  @Auth()
  public async getVideos(ctx: Koa.Context | any) {
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
