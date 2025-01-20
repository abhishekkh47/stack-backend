import MilestoneController from "@controllers/v10/milestones";
import EmployeeController from "@controllers/v10/employee";
import QuizController from "@controllers/v10/quiz";
import BusinessProfileController from "@controllers/v10/business-profile";
import { getRouteDict } from "@app/utility";
const routeDict = getRouteDict("10.0.0", [
  MilestoneController,
  EmployeeController,
  QuizController,
  BusinessProfileController,
]);

export default routeDict;
