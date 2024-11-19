import mongoose from "mongoose";

export interface IStage {
  categoryId: mongoose.Schema.Types.ObjectId;
  title: string;
  subTitle: string;
  description: string;
  guidebook: string[];
  backgroundColor: string;
  guidebookColor: string;
  order: number;
  type: number;
  reward: number;
  cash: number;
  rating: number;
  image: string;
  colorInfo: IColorBook;
}

interface IColorBook {
  outer: IColorDetails;
  inner: IColorDetails;
}

interface IColorDetails {
  colors: string[];
  location: mongoose.Schema.Types.Decimal128[];
  angle: number;
}
