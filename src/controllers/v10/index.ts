import MilestoneController from "@controllers/v10/milestones";
import EmployeeController from "@controllers/v10/employee";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("10.0.0", [
  MilestoneController,
  EmployeeController,
]);

export default routeDict;
