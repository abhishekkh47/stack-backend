export interface IMarketSegmentInfo {
  marketSegment: string;
  businessType: number;
  uniqueness: IBusinessAspects;
  marketSize: IBusinessAspects;
  complexity: IBusinessAspects;
}

interface IBusinessAspects {
  rating: number;
  description: string;
}
