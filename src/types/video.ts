export interface IVideo {
  videoCategory: string;
  status: number;
  videoList: IVideoList[];
}

export interface IVideoList {
  title: string;
  thumbnail: string;
  url: string;
  position: number;
}
