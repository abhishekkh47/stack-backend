export interface IMarketSegmentInfo {
  marketSegment: string;
  businessType: number;
  uniqueness: IBusinessAspects;
  marketSize: IBusinessAspects;
  complexity: IBusinessAspects;
}

interface IBusinessAspects {
  criteria: string;
  rating: number;
  description: string;
  image: string;
}
