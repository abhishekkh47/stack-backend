export interface IActionScoringCriteria {
  key: string;
  scoringCriteria: IScoringCriteria[];
}

interface IScoringCriteria {
  name: string;
  icon: string;
  description: string;
}
