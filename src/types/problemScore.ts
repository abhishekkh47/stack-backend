export interface IProblemScore {
  /**
   * type = 1 - 'Physical Product' AND 2 - 'Software Technology' AND 3 - 'Content Brand'
   */
  type: number;
  problem: string;
  pricePointIndex: number;
  pricePointExplanation: string;
  demandScore: number;
  demandScoreExplanation: string;
  trendingScore: number;
  trendingScoreExplanation: string;
  overallRating: number;
}
