export interface IVideo {
  videoTopic: string;
  status: number;
  videoList: IVideoList[];
}

export interface IVideoList {
  title: string;
  url: string;
  position: number;
}
