import { NetworkError } from "@app/middleware";
import { UserEmployeesTable } from "@app/model";
import { EMP_STATUS } from "@app/utility";
import { EmployeeDBService as EmployeeDBServiceV9 } from "@app/services/v9";
class EmployeeDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getEmployeeList(userIfExists: any, businessProfile: any) {
    try {
      let [employees, userEmployees, hiredEmployees] = await Promise.all([
        EmployeeDBServiceV9.getAllEmployees(),
        UserEmployeesTable.find({ userId: userIfExists._id }),
        EmployeeDBServiceV9.listHiredEmployees(userIfExists),
      ]);
      // unlock the first employee for existing users if they have already completed the trigger task
      if (
        businessProfile?.completedActions?.valueProposition &&
        userEmployees?.length == 0
      ) {
        userEmployees =
          await EmployeeDBServiceV9.unlockDefaultEmployeesForExistingUsers(
            userIfExists
          );
      }

      // Map employees and enrich with status and other details
      const userEmployeesMap = new Map(
        userEmployees.map((emp) => [emp?.employeeId?.toString(), emp])
      );
      const hiredEmployeesMap = new Map(
        hiredEmployees.map((hired) => [hired?.employeeId?.toString(), hired])
      );

      const updatedEmployees = employees.map((emp) => {
        const empIdStr = emp._id.toString();
        const userEmp = userEmployeesMap.get(empIdStr);
        const hiredEmp = hiredEmployeesMap.get(empIdStr);
        let isLocked = true;
        let status = EMP_STATUS.LOCKED;
        let endTime = null;
        let resultCopyInfo = null;
        if (userEmp) {
          const currentStatus = hiredEmp ? hiredEmp.status : userEmp?.status;
          const projectInProgressOrCompleted =
            currentStatus == EMP_STATUS.WORKING ||
            currentStatus == EMP_STATUS.COMPLETED;
          isLocked = false;
          status = currentStatus;
          endTime = projectInProgressOrCompleted ? hiredEmp.endTime : null;
          resultCopyInfo = projectInProgressOrCompleted
            ? hiredEmp.resultCopyInfo
            : null;
        }
        return { ...emp, isLocked, status, endTime, resultCopyInfo };
      });
      return updatedEmployees;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving employee list",
        400
      );
    }
  }
}

export default new EmployeeDBService();
