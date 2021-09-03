export type MongooseModel<T> = T & MongooseBaseType;

export interface MongooseBaseType {
  readonly _id: string;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}
