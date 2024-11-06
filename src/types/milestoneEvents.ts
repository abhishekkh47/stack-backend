export interface IMilestoneEvents {
  eventId: number;
  scenario: string;
  scenarioImage: string;
  options: IMilestoneEventsResponse[];
}

interface IMilestoneEventsResponse {
  choice: string;
  action: string;
  resultCopyInfo: IResultCopyInfo[];
  fans: number;
  cash: number;
  businessScore: number;
  token: number;
}

interface IResultCopyInfo {
  image: string;
  description: string;
}
