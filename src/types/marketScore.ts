export interface IMarketScore {
  /**
   * type = 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
   */
  type: number;
  marketSegment: string;
  hhiRating: number;
  hhiExplanation: string;
  customerSatisfactionRating: number;
  customerSatisfactionExplanation: string;
  ageIndexRating: number;
  ageIndexExplanation: string;
  tamRating: number;
  tamExplanation: string;
  cagrRating: number;
  cagrExplanation: string;
  overallRating: number;
}
