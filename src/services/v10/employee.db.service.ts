import { NetworkError } from "@app/middleware";
import { UserEmployeesTable, UserTable } from "@app/model";
import { EMP_STATUS, getDaysNum } from "@app/utility";
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

  /**
   * @description This is to check if any employee is available to work or if the project is completed
   * @description based on which we can show the notification dot on the tab icon
   * @param userExists
   * @param businessProfile
   */
  public async ifEmployeeNotificationAvailable(
    userExists: any,
    businessProfile: any
  ) {
    try {
      const employeePageVisited = userExists?.employeePageVisited;
      const dayDiff =
        getDaysNum(userExists, employeePageVisited?.visitedAt) >= 1;
      let showEmpNotification = false;
      if (dayDiff) {
        const [employees, _] = await Promise.all([
          this.getEmployeeList(userExists, businessProfile),
          UserTable.findOneAndUpdate(
            { _id: userExists._id },
            {
              $set: { "employeePageVisited.status": false },
            },
            { upsert: true }
          ),
        ]);
        employees?.forEach((emp) => {
          if (
            emp?.status !== EMP_STATUS.WORKING &&
            emp?.status !== EMP_STATUS.LOCKED
          )
            showEmpNotification = true;
          return;
        });
      }
      return showEmpNotification;
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }

  /**
   * @description This is to update the DB if the user has visited employee page atleast once on current day
   * @param userIfExists
   */
  public async updateEmpVisitedStatus(userIfExists: any) {
    try {
      const employeePageVisited = userIfExists?.employeePageVisited;
      const lastVisitedAt = employeePageVisited?.visitedAt;
      const shouldUpdate =
        !lastVisitedAt || getDaysNum(userIfExists, lastVisitedAt) >= 1;

      if (shouldUpdate) {
        await UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          {
            $set: {
              employeePageVisited: { visitedAt: new Date(), status: true },
            },
          },
          { upsert: true }
        );
      }
    } catch (error) {
      throw new NetworkError(error.message, 404);
    }
  }
}

export default new EmployeeDBService();
