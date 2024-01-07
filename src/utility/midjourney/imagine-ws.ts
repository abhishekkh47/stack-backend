import "dotenv/config";
import { Midjourney } from "./midjourney";
import axios from "axios";
import * as fs from "fs";
/**
 *
 * a simple example of using the imagine api with ws
 * ```
 * npx tsx example/imagine-ws.ts
 * ```
 */
export async function generateImage(prompt) {
  const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
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
    return;
  }
  client.Close();
  return Imagine;
}
export async function UpscaleImage(Imagine) {
  const client = new Midjourney({
    ServerId: <string>process.env.SERVER_ID,
    ChannelId: <string>process.env.CHANNEL_ID,
    SalaiToken: <string>process.env.SALAI_TOKEN,
    HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
    Debug: true,
    Ws: true, // required  `Only you can see this`
  });
  await client.Connect(); // required
  const Upscale = await client.Upscale({
    index: 2,
    msgId: <string>Imagine.id,
    hash: <string>Imagine.hash,
    flags: Imagine.flags,
    loading: (uri: string, progress: string) => {
      console.log("Upscale.loading", uri, "progress", progress);
    },
  });

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
