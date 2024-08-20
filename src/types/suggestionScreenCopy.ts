export interface ISuggestionScreenCopy {
  key: string;
  name: string;
  title: string;
  actionName: string;
  placeHolderText: string;
  maxCharLimit: number;
  isMultiLine: boolean;
  actionType: string;
  isGrid: boolean;
  section: string;
  stepList: IStepList[];
}

interface IStepList {
  stepName: string;
  stepStatus: number;
  value: number;
}
