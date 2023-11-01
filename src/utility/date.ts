import { IMDY } from "@app/types";
import moment from "moment";

export function formatMDY(mdy: IMDY, formatStr: string) {
  const formattedDate = moment(`${mdy.year}-${mdy.month}-${mdy.day}`, 'YYYY-M-D').format(formatStr);
  return formattedDate;
}
