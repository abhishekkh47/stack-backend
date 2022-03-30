export interface IVideo {
  videoCategory: string;
  status: number;
  videoList: IVideoList[];
}

export interface IVideoList {
  title: string;
  url: string;
  position: number;
}
