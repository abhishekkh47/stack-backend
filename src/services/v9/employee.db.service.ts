import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import {
  UserTable,
  EmployeeTable,
  EmployeeLevelsTable,
  UserEmployeesTable,
} from "@app/model";
import { EMP_STATUS } from "@app/utility";
class EmployeeDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getEmployeeList(userIfExists: any, businessProfile: any) {
    try {
      let isLocked = true;
      let [employees, userEmployees] = await Promise.all([
        EmployeeTable.find({ order: 1 }).sort({ order: 1 }).lean(),
        UserEmployeesTable.find({ userId: userIfExists._id }),
      ]);
      // unlock the first employee for existing users if they have already completed the trigger task
      if (
        businessProfile?.completedActions?.competitors &&
        userEmployees?.length == 0
      ) {
        await this.unlockEmployee(userIfExists, employees[0]._id);
        userEmployees = await UserEmployeesTable.find({
          userId: userIfExists._id,
        });
      }
      const updatedEmployees = employees.map((emp) => {
        if (userEmployees?.length) {
          isLocked = !userEmployees?.some(
            (obj) => obj.employeeId.toString() == emp._id.toString()
          );
        }
        return { ...emp, isLocked };
      });
      return updatedEmployees;
    } catch (error) {
      throw new NetworkError("Error occurred while employee list", 400);
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
      const [employeeLevels, userEmployees] = await Promise.all([
        EmployeeLevelsTable.find({ employeeId }).lean(),
        UserEmployeesTable.findOne({
          userId: userIfExists._id,
          employeeId,
        }).lean(),
      ]);
      if (userEmployees) {
        employeeDetails = employeeLevels.find(
          (emp) =>
            emp.level == userEmployees.currentLevel &&
            emp.employeeId == employeeId
        );
        if (userEmployees.currentLevel < userEmployees.unlockedLevel) {
          promotionAvailable = true;
        }
      } else {
        employeeDetails = employeeLevels.find(
          (emp) => emp.level == 1 && emp.employeeId == employeeId
        );
      }
      return employeeDetails;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while retrieving employee details",
        400
      );
    }
  }

  /**
   * @description hire an employee from the marketplace
   * @param userIfExists
   * @param employeeId
   * @returns {*}
   */
  public async hireEmployee(userIfExists: any, employeeId: any) {
    try {
      const [userEmployee, employeeDetails] = await Promise.all([
        UserEmployeesTable.findOne({
          userId: userIfExists._id,
          employeeId,
        }).lean(),
        EmployeeTable.findOne({ _id: employeeId }).lean(),
      ]);
      if (!userEmployee) {
        throw new NetworkError("Please unlock the employee to hire it", 400);
      }
      if (userEmployee.status == EMP_STATUS.HIRED) {
        throw new NetworkError("This employee have been already hired", 400);
      }
      if (userEmployee.status == EMP_STATUS.UNLOCKED) {
        await Promise.all([
          UserEmployeesTable.findOneAndUpdate(
            { userId: userIfExists._id, employeeId },
            { $set: { status: EMP_STATUS.HIRED } },
            { upsert: true, new: true }
          ),
          UserTable.findOneAndUpdate(
            { _id: userIfExists._id },
            { $inc: { quizCoins: -employeeDetails.price } }
          ),
        ]);
      }
      return true;
    } catch (error) {
      throw new NetworkError("Error occurred while hiring the employee", 400);
    }
  }

  /**
   * @description unlock an employee
   * @param userIfExists
   * @param employeeId
   * @returns {*}
   */
  public async unlockEmployee(userIfExists: any, employeeId: any) {
    try {
      const [userEmployee, employee, employeeInitialLevel] = await Promise.all([
        UserEmployeesTable.findOne({
          userId: userIfExists._id,
          employeeId,
        }),
        EmployeeTable.findOne({ _id: employeeId }),
        EmployeeLevelsTable.findOne({ employeeId }),
      ]);
      if (userEmployee) {
        throw new NetworkError("This employee have been unlocked already", 400);
      }
      if (!employee) {
        throw new NetworkError("This employee do not exists", 400);
      }

      await UserEmployeesTable.findOneAndUpdate(
        { userId: userIfExists._id, employeeId },
        {
          $set: {
            userId: userIfExists._id,
            employeeId,
            currentLevel: 1,
            unlockedLevel: 1,
            currentRatings: employeeInitialLevel.ratingValues,
            hiredAt: new Date(),
            status: EMP_STATUS.UNLOCKED,
          },
        },
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while unlocking the employee",
        400
      );
    }
  }

  /**
   * @description get projects available to a hired employee
   * @param userIfExists
   * @param employeeId
   * @returns {*}
   */
  public async getEmployeeProjects(userIfExists: any, employeeId: any) {
    try {
      const employeeProjects = await EmployeeLevelsTable.aggregate([
        {
          $match: { employeeId: new ObjectId(employeeId) },
        },
        {
          $lookup: {
            from: "employee_projects",
            localField: "_id",
            foreignField: "employeeLevelId",
            as: "emp_projects",
          },
        },
        {
          $unwind: {
            path: "$emp_projects",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            employeeId: 1,
            employeeLevelId: "$emp_projects.employeeLevelId",
            order: "$emp_projects.order",
            description: "$emp_projects.employeeLevelId",
            title: "$emp_projects.title",
          },
        },
      ]).exec();
      return employeeProjects;
    } catch (error) {
      throw new NetworkError("Error occurred while listing projects", 400);
    }
  }
}

export default new EmployeeDBService();
