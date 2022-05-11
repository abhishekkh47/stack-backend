export interface IVideo {
  videoCategory: string;
  status: number;
  data: IVideoList[];
}

export interface IVideoList {
  coverImage: string;
  images: string[];
}
