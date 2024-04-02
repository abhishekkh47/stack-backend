import BusinessProfileController from "@controllers/v9/business-profile";
import CoachController from "@app/controllers/v9/coach";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("9.0.0", [
  BusinessProfileController,
  CoachController,
]);

export default routeDict;
