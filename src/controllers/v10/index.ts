import MilestoneController from "@controllers/v10/milestones";
import EmployeeController from "@controllers/v10/employee";
import DripshopController from "@controllers/v10/dripshop";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("10.0.0", [
  MilestoneController,
  EmployeeController,
  DripshopController,
]);

export default routeDict;
