import { NetworkError } from "@app/middleware";
import {
  UserTable,
  EmployeeTable,
  EmployeeLevelsTable,
  EmployeeProjectsTable,
} from "@app/model";
import {
  EMPLOYEES,
  EMPLOYEE_LEVELS,
  EMPLOYEE_PROJECTS,
  USER_EMPLOYEES,
} from "@app/utility";
class EmployeeDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getEmployeeList(userIfExists: any) {
    try {
      let isLocked = true;
      const employees = await EmployeeTable.find();
      const userEmployees = USER_EMPLOYEES.filter(
        (obj) => obj.user_id == userIfExists._id
      );
      const updatedEmployees = employees.map((emp) => {
        if (userEmployees.length) {
          isLocked = !userEmployees?.some((obj) => obj.employeeId == emp._id);
        }
        return { ...emp, isLocked };
      });
      return updatedEmployees;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving quiz topics",
        400
      );
    }
  }

  /**
   * @description get employee information available for the given user
   * @param userIfExists
   * @param employeeId
   * @returns {*}
   */
  public async getEmployeeDetails(userIfExists: any, employeeId: any) {
    try {
      let employeeDetails = {},
        promotionAvailable = false;
      const employeeLevels = await EmployeeLevelsTable.find({ employeeId });
      const userEmployees = USER_EMPLOYEES.find((obj) => {
        obj.user_id == userIfExists._id && obj.employeeId == employeeId;
      });
      if (userEmployees) {
        employeeDetails = EMPLOYEE_LEVELS.find(
          (emp) =>
            emp.level == userEmployees.currentLevel &&
            emp.employeeId == employeeId
        );
        if (userEmployees.currentLevel < userEmployees.levelUnlocked) {
          promotionAvailable = true;
        }
      } else {
        employeeDetails = EMPLOYEE_LEVELS.find(
          (emp) => emp.level == 1 && emp.employeeId == employeeId
        );
      }
      return employeeDetails;
    } catch (err) {
      throw new NetworkError(
        "Error occurred while retrieving quiz topics",
        400
      );
    }
  }
}

export default new EmployeeDBService();
