export interface IMilestoneEvents {
  eventId: number;
  scenario: string;
  scenarioImage: string;
  options: IMilestoneEventsResponse[];
}

interface IMilestoneEventsResponse {
  choice: string;
  action: string;
  response: string;
  responseImage: string;
  fans: number;
  cash: number;
  businessScore: number;
  token: number;
}
