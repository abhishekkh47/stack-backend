import "dotenv/config";
import { Midjourney } from "./midjourney";
import axios from "axios";
import * as fs from "fs";
import { awsLogger, IMPORT_SCRIPT } from "@app/utility";
import envData from "@app/config";
/**
 *
 * a simple example of using the imagine api with ws
 * ```
 * npx tsx example/imagine-ws.ts
 * ```
 */
export async function generateImage(prompt, type = null) {
  const client = new Midjourney({
    ServerId:
      <string>type == IMPORT_SCRIPT
        ? envData.IMPORT_SERVER_ID
        : envData.SERVER_ID,
    ChannelId:
      <string>type == IMPORT_SCRIPT
        ? envData.IMPORT_CHANNEL_ID
        : envData.CHANNEL_ID,
    SalaiToken:
      <string>type == IMPORT_SCRIPT
        ? envData.IMPORT_SALAI_TOKEN
        : envData.SALAI_TOKEN,
    HuggingFaceToken: <string>envData.HUGGINGFACE_TOKEN,
    Debug: true,
    Ws: true, // required  `Only you can see this`
  });
  await client.Connect(); // required
  const Imagine = await client.Imagine(
    prompt,
    (uri: string, progress: string) => {
      console.log("Imagine.loading", uri, "progress", progress);
    }
  );
  if (!Imagine) {
    awsLogger.error(
      `{function:generateImage || message:MidJourney Client could not be created}`
    );
    return;
  }
  client.Close();
  return Imagine;
}
export async function UpscaleImage(
  Imagine,
  upscaleIndex: 1 | 2 | 3 | 4 = 2,
  type = null
) {
  const client = new Midjourney({
    ServerId:
      <string>type == IMPORT_SCRIPT
        ? envData.IMPORT_SERVER_ID
        : envData.SERVER_ID,
    ChannelId:
      <string>type == IMPORT_SCRIPT
        ? envData.IMPORT_CHANNEL_ID
        : envData.CHANNEL_ID,
    SalaiToken:
      <string>type == IMPORT_SCRIPT
        ? envData.IMPORT_SALAI_TOKEN
        : envData.SALAI_TOKEN,
    HuggingFaceToken: <string>envData.HUGGINGFACE_TOKEN,
    Debug: true,
    Ws: true, // required  `Only you can see this`
  });
  await client.Connect(); // required
  const Upscale = await client.Upscale({
    index: upscaleIndex,
    msgId: <string>Imagine.id,
    hash: <string>Imagine.hash,
    flags: Imagine.flags,
    loading: (uri: string, progress: string) => {
      console.log("Upscale.loading", uri, "progress", progress);
    },
  });
  if (!Imagine) {
    awsLogger.error(
      `{function:UpscaleImage || message:Imagine API response is invalid || imagineResponse: ${Imagine}}`
    );
    return;
  }
  client.Close();
  return Upscale;
}
export async function downloadImage(
  url: string,
  outputPath: string
): Promise<void> {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });

  response.data.pipe(fs.createWriteStream(outputPath));

  return new Promise((resolve, reject) => {
    response.data.on("end", () => resolve());
    response.data.on("error", (err: any) => reject(err));
  });
}
