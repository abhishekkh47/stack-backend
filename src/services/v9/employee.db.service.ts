import { NetworkError } from "@app/middleware";
import { ObjectId } from "mongodb";
import {
  UserTable,
  EmployeeTable,
  EmployeeLevelsTable,
  UserEmployeesTable,
  UserProjectsTable,
  EmployeeProjectsTable,
} from "@app/model";
import { EMP_STATUS, MILESTONE_HOMEPAGE } from "@app/utility";
class EmployeeDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getEmployeeList(userIfExists: any, businessProfile: any) {
    try {
      let isLocked = true,
        status = EMP_STATUS.UNLOCKED;
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
          const userEmp = userEmployees.find(
            (obj) => obj.employeeId.toString() == emp._id.toString()
          );
          if (userEmp) {
            isLocked = false;
          } else {
            isLocked = true;
          }
          status = userEmp.status;
        }
        return { ...emp, isLocked, status };
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
      const empId = new ObjectId(employeeId);
      let employeeDetails = {},
        promotionAvailable = false;
      const [employeeLevels, userEmployees] = await Promise.all([
        EmployeeLevelsTable.find({ employeeId: empId }).lean(),
        UserEmployeesTable.findOne({
          userId: userIfExists._id,
          employeeId: empId,
        }).lean(),
      ]);
      if (userEmployees) {
        employeeDetails = employeeLevels.find(
          (emp) =>
            emp.level == userEmployees.currentLevel &&
            emp.employeeId.toString() == empId.toString()
        );
        if (userEmployees.currentLevel < userEmployees.unlockedLevel) {
          promotionAvailable = true;
        }
      } else {
        employeeDetails = employeeLevels.find(
          (emp) =>
            emp.level == 1 && emp.employeeId.toString() == empId.toString()
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
      const empId = new ObjectId(employeeId);
      const [userEmployee, employeeDetails] = await Promise.all([
        UserEmployeesTable.findOne({
          userId: userIfExists._id,
          employeeId: empId,
        }).lean(),
        EmployeeTable.findOne({ _id: empId }).lean(),
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
            { userId: userIfExists._id, employeeId: empId },
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
      const empId = new ObjectId(employeeId);
      const [userEmployee, employee, employeeInitialLevel] = await Promise.all([
        UserEmployeesTable.findOne({
          userId: userIfExists._id,
          employeeId: empId,
        }),
        EmployeeTable.findOne({ _id: empId }),
        EmployeeLevelsTable.findOne({ employeeId: empId }),
      ]);
      if (userEmployee) {
        throw new NetworkError("This employee have been unlocked already", 400);
      }
      if (!employee) {
        throw new NetworkError("This employee do not exists", 400);
      }

      await UserEmployeesTable.findOneAndUpdate(
        { userId: userIfExists._id, employeeId: empId },
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
      const empId = new ObjectId(employeeId);
      const userEmployee = await UserEmployeesTable.findOne({
        userId: userIfExists._id,
        employeeId: empId,
      }).lean();
      const employeeProjects = await EmployeeLevelsTable.aggregate([
        {
          $match: {
            employeeId: empId,
            level: userEmployee.currentLevel,
          },
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
            description: "$emp_projects.description",
            title: "$emp_projects.title",
          },
        },
      ]).exec();
      return employeeProjects;
    } catch (error) {
      throw new NetworkError("Error occurred while listing projects", 400);
    }
  }

  /**
   * @description get list of hired employees
   * @param userIfExists
   * @returns {*}
   */
  public async listHiredEmployees(userIfExists: any) {
    try {
      const [hiredEmployees, userProjects, projectDetails] = await Promise.all([
        UserEmployeesTable.aggregate([
          {
            $match: {
              userId: userIfExists._id,
              status: EMP_STATUS.HIRED,
            },
          },
          {
            $lookup: {
              from: "employees",
              localField: "employeeId",
              foreignField: "_id",
              as: "employeeInfo",
            },
          },
          {
            $unwind: {
              path: "$employeeInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "employee_levels",
              let: {
                empId: "$employeeId",
                currentLevel: "$currentLevel",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$employeeId", "$$empId"] },
                        { $eq: ["$level", "$$currentLevel"] },
                      ],
                    },
                  },
                },
              ],
              as: "levelInfo",
            },
          },
          {
            $unwind: {
              path: "$levelInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              employeeId: 1,
              employeeName: "$employeeInfo.name",
              currentLevel: 1,
              title: "$levelInfo.title",
              status: 1,
              iconImage: "$employeeInfo.image",
              key: MILESTONE_HOMEPAGE.EMPLOYEE,
            },
          },
        ]).exec(),
        UserProjectsTable.find({ userId: userIfExists._id }),
        EmployeeProjectsTable.find({}),
      ]);
      if (userProjects.length && hiredEmployees.length) {
        hiredEmployees.forEach((emp) => {
          const userProject = userProjects.find(
            (usr) => emp?.employeeId.toString() == usr?.employeeId.toString()
          );
          if (userProject && userProject?.status != EMP_STATUS.HIRED) {
            emp.status = userProject.status;
            emp["startTime"] = userProject.startedAt;
            if (userProject?.status == EMP_STATUS.COMPLETED) {
              const project = projectDetails.find(
                (proj) =>
                  proj._id.toString() == userProject.projectId.toString()
              );
              const rewards = project.rewards[0];
              emp["resultCopyInfo"] = {
                image: [
                  {
                    image: rewards.image,
                    description: rewards.description,
                  },
                ],
                resultSummary: [
                  {
                    title: rewards.cash,
                    type: "K",
                    icon: "dollar_banknote.webp",
                  },
                  {
                    title: rewards.rating,
                    type: " Rating",
                    icon: "military_medal.webp",
                  },
                ],
              };
            }
          }
        });
      }
      return hiredEmployees;
    } catch (error) {
      throw new NetworkError(
        "Error occurred while listing hired employees",
        400
      );
    }
  }

  /**
   * @description start a project for an employee
   * @param userIfExists
   * @param data
   * @returns {*}
   */
  public async startEmployeeProject(userIfExists: any, data: any) {
    try {
      const { employeeId, projectId } = data;
      const projectObj = {
        userId: userIfExists._id,
        employeeId,
        projectId,
        status: EMP_STATUS.WORKING,
        startedAt: new Date(),
        completedAt: null,
      };
      await Promise.all([
        UserProjectsTable.findOneAndUpdate(
          {
            userId: userIfExists._id,
            employeeId,
          },
          projectObj,
          { upsert: true }
        ),
        UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          { $inc: { cash: -5 } }
        ),
      ]);
      return true;
    } catch (error) {
      throw new NetworkError("Error occurred starting the project", 400);
    }
  }
}

export default new EmployeeDBService();
