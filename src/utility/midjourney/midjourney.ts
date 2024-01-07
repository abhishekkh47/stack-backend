import {
  DefaultMJConfig,
  LoadingHandler,
  MJConfig,
  MJConfigParam,
} from "./interfaces";
import { MidjourneyApi } from "./midjourney.api";
import { MidjourneyMessage } from "./discord.message";
import {
  toRemixCustom,
  custom2Type,
  nextNonce,
  random,
  base64ToBlob,
} from "./utils";
import { WsMessage } from "./discord.ws";
export class Midjourney extends MidjourneyMessage {
  public config: MJConfig;
  private wsClient?: WsMessage;
  public MJApi: MidjourneyApi;
  constructor(defaults: MJConfigParam) {
    const { SalaiToken } = defaults;
    if (!SalaiToken) {
      throw new Error("SalaiToken are required");
    }
    super(defaults);
    this.config = {
      ...DefaultMJConfig,
      ...defaults,
    };
    this.MJApi = new MidjourneyApi(this.config);
  }
  async Connect() {
    if (!this.config.Ws) {
      return this;
    }
    //if auth failed, will throw error
    if (this.config.ServerId) {
      await this.MJApi.getCommand("settings");
    } else {
      await this.MJApi.allCommand();
    }
    if (this.wsClient) return this;
    this.wsClient = new WsMessage(this.config, this.MJApi);
    await this.wsClient.onceReady();
    return this;
  }
  async init() {
    await this.Connect();
    const settings = await this.Settings();
    if (settings) {
      // this.log(`settings:`, settings.content);
      const remix = settings.options.find((o) => o.label === "Remix mode");
      if (remix?.style == 3) {
        this.config.Remix = true;
        this.log(`Remix mode enabled`);
      }
    }
    return this;
  }
  async Imagine(prompt: string, loading?: LoadingHandler) {
    prompt = prompt.trim();
    if (!this.config.Ws) {
      const seed = random(1000000000, 9999999999);
      prompt = `[${seed}] ${prompt}`;
    } else {
      await this.getWsClient();
    }

    const nonce = nextNonce();
    this.log(`Imagine`, prompt, "nonce", nonce);
    const httpStatus = await this.MJApi.ImagineApi(prompt, nonce);
    if (httpStatus !== 204) {
      throw new Error(`ImagineApi failed with status ${httpStatus}`);
    }
    if (this.wsClient) {
      return await this.wsClient.waitImageMessage({ nonce, loading, prompt });
    } else {
      this.log(`await generate image`);
      const msg = await this.WaitMessage(prompt, loading);
      this.log(`image generated`, prompt, msg?.uri);
      return msg;
    }
  }
  // check ws enabled && connect
  private async getWsClient() {
    if (!this.config.Ws) {
      throw new Error(`ws not enabled`);
    }
    if (!this.wsClient) {
      await this.Connect();
    }
    if (!this.wsClient) {
      throw new Error(`ws not connected`);
    }
    return this.wsClient;
  }

  async Settings() {
    const wsClient = await this.getWsClient();
    const nonce = nextNonce();
    const httpStatus = await this.MJApi.SettingsApi(nonce);
    if (httpStatus !== 204) {
      throw new Error(`ImagineApi failed with status ${httpStatus}`);
    }
    return wsClient.waitSettings();
  }

  async Variation({
    index,
    msgId,
    hash,
    content,
    flags,
    loading,
  }: {
    index: 1 | 2 | 3 | 4;
    msgId: string;
    hash: string;
    content?: string;
    flags: number;
    loading?: LoadingHandler;
  }) {
    return await this.Custom({
      customId: `MJ::JOB::variation::${index}::${hash}`,
      msgId,
      content,
      flags,
      loading,
    });
  }

  async Upscale({
    index,
    msgId,
    hash,
    content,
    flags,
    loading,
  }: {
    index: 1 | 2 | 3 | 4;
    msgId: string;
    hash: string;
    content?: string;
    flags: number;
    loading?: LoadingHandler;
  }) {
    return await this.Custom({
      customId: `MJ::JOB::upsample::${index}::${hash}`,
      msgId,
      content,
      flags,
      loading,
    });
  }

  async Custom({
    msgId,
    customId,
    content,
    flags,
    loading,
  }: {
    msgId: string;
    customId: string;
    content?: string;
    flags: number;
    loading?: LoadingHandler;
  }) {
    if (this.config.Ws) {
      await this.getWsClient();
    }
    const nonce = nextNonce();
    const httpStatus = await this.MJApi.CustomApi({
      msgId,
      customId,
      flags,
      nonce,
    });
    if (httpStatus !== 204) {
      throw new Error(`CustomApi failed with status ${httpStatus}`);
    }
    if (this.wsClient) {
      return await this.wsClient.waitImageMessage({
        nonce,
        loading,
        messageId: msgId,
        prompt: content,
        onmodal: async (nonde, id) => {
          if (content === undefined || content === "") {
            return "";
          }
          const newNonce = nextNonce();
          switch (custom2Type(customId)) {
            case "customZoom":
              const httpStatus = await this.MJApi.CustomZoomImagineApi({
                msgId: id,
                customId,
                prompt: content,
                nonce: newNonce,
              });
              if (httpStatus !== 204) {
                throw new Error(
                  `CustomZoomImagineApi failed with status ${httpStatus}`
                );
              }
              return newNonce;
            case "variation":
              if (this.config.Remix !== true) {
                return "";
              }
              customId = toRemixCustom(customId);
              const remixHttpStatus = await this.MJApi.RemixApi({
                msgId: id,
                customId,
                prompt: content,
                nonce: newNonce,
              });
              if (remixHttpStatus !== 204) {
                throw new Error(
                  `RemixApi failed with status ${remixHttpStatus}`
                );
              }
              return newNonce;
            default:
              return "";
              throw new Error(`unknown customId ${customId}`);
          }
        },
      });
    }
    if (content === undefined || content === "") {
      throw new Error(`content is required`);
    }
    return await this.WaitMessage(content, loading);
  }

  async Reroll({
    msgId,
    hash,
    content,
    flags,
    loading,
  }: {
    msgId: string;
    hash: string;
    content?: string;
    flags: number;
    loading?: LoadingHandler;
  }) {
    return await this.Custom({
      customId: `MJ::JOB::reroll::0::${hash}::SOLO`,
      msgId,
      content,
      flags,
      loading,
    });
  }
  Close() {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = undefined;
    }
  }
}
