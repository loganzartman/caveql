export type MapRecordsHostMessage =
  | {
      type: "map-records";
      records: Record<string, unknown>[];
    }
  | {
      type: "set-fn";
      functionExpression: string;
    };

export type MapRecordsWorkerMessage = {
  type: "return-records";
  records: Record<string, unknown>[];
};

export function mapRecordsHostMessage(
  msg: MapRecordsHostMessage,
): MapRecordsHostMessage {
  return msg;
}

export function mapRecordsWorkerMessage(
  msg: MapRecordsWorkerMessage,
): MapRecordsWorkerMessage {
  return msg;
}
