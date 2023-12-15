import WeeklyJourneyController from "@controllers/v7/weekly-journey";
import BusinessProfileController from "@controllers/v7/business-profile";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("7.0.0", [
  WeeklyJourneyController,
  BusinessProfileController,
]);

export default routeDict;
