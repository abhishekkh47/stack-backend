export interface ICoachProfile {
  key: string;
  name: string;
  linkedIn: string;
  rating: number;
  reviews: number;
  mobile: string;
  about: string;
  skills: string[];
  whyItsValuable: IWhyItsValuableArray[];
}

interface IWhyItsValuableArray {
  name: string;
  description: string;
}
