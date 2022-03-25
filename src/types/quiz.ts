export interface IQuizTopic {
  topic: string;
  status: number;
}

export enum EQuizTopicStatus {
  ACTIVE = 1,
  INACTIVE = 0,
}
