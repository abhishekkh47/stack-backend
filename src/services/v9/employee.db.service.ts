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
import {
  EMP_STATUS,
  MILESTONE_HOMEPAGE,
  getDaysNum,
  DEFAULT_EMPLOYEE,
  EMP_START_PROJECT_COST,
  HOUR_TO_MS,
} from "@app/utility";
import { MilestoneDBService } from "@services/v9";
class EmployeeDBService {
  /**
   * @description get all Topics and current level in each topic
   * @param userIfExists
   * @returns {*}
   */
  public async getEmployeeList(userIfExists: any, businessProfile: any) {
    try {
      let isLocked = true,
        status = EMP_STATUS.LOCKED;
      let [employees, userEmployees] = await Promise.all([
        EmployeeTable.find(
          { available: true },
          {
            name: 1,
            bio: 1,
            icon: 1,
            image: 1,
            userType: 1,
            price: 1,
            title: 1,
            workTime: 1,
          }
        )
          .sort({ order: 1 })
          .lean(),
        UserEmployeesTable.find({ userId: userIfExists._id }),
      ]);
      // unlock the first employee for existing users if they have already completed the trigger task
      if (
        businessProfile?.completedActions?.valueProposition &&
        userEmployees?.length == 0
      ) {
        const initialEmployees = await EmployeeTable.find({
          order: { $in: [1, 2, 3] },
        });
        const initialEmpArray = initialEmployees.map((emp) => {
          return { employeeId: emp._id, level: 1 };
        });
        await this.unlockEmployee(userIfExists, initialEmpArray);
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
            status = userEmp?.status;
          } else {
            isLocked = true;
            status = EMP_STATUS.LOCKED;
          }
        }
        return { ...emp, isLocked, status };
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
   * @param unlockedEmployees list of employees unlocked by user
   * @returns {*}
   */
  public async unlockEmployee(userIfExists: any, unlockedEmployees: any = []) {
    try {
      let bulkWriteObj = [];
      const unlockedEmployeeIds = unlockedEmployees?.map(
        (emp) => emp.employeeId
      );
      if (!unlockedEmployeeIds.length) {
        return true;
      }
      const [userEmployee, unlockedEmployeesList, employeeInitialLevel] =
        await Promise.all([
          UserEmployeesTable.find({
            userId: userIfExists._id,
            employeeId: { $in: unlockedEmployeeIds },
          }),
          EmployeeTable.find({ _id: { $in: unlockedEmployeeIds }, level: 1 }),
          EmployeeLevelsTable.find({
            employeeId: { $in: unlockedEmployeeIds },
          }),
        ]);
      if (userEmployee.length == unlockedEmployeeIds.length) {
        throw new NetworkError("This employee have been unlocked already", 400);
      }
      if (!unlockedEmployeesList.length) {
        throw new NetworkError("This employee do not exists", 400);
      }

      unlockedEmployees.forEach((emp) => {
        const initialLevel = employeeInitialLevel.find(
          (obj) => obj.employeeId.toString() == emp.employeeId.toString()
        );
        const isProEmployee = unlockedEmployeesList.find(
          (obj) => obj._id.toString() == emp.employeeId.toString()
        );
        bulkWriteObj.push({
          updateOne: {
            filter: {
              userId: userIfExists._id,
              employeeId: emp.employeeId,
            },
            update: {
              $set: {
                userId: userIfExists._id,
                employeeId: emp.employeeId,
                currentLevel: 1,
                unlockedLevel: emp.level,
                currentRatings: initialLevel.ratingValues,
                hiredAt: null,
                status: EMP_STATUS.UNLOCKED,
                isProEmployee: isProEmployee.userType || 0,
              },
            },
            upsert: true,
          },
        });
      });
      if (bulkWriteObj.length) {
        await UserEmployeesTable.bulkWrite(bulkWriteObj);
      }
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
            projectId: "$emp_projects._id",
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
        hiredEmployees.forEach(async (emp) => {
          const userProject = userProjects.find(
            (usr) => emp?.employeeId.toString() == usr?.employeeId.toString()
          );
          if (userProject && userProject?.status == EMP_STATUS.WORKING) {
            emp.status = userProject.status;
            emp["startTime"] = userProject.startedAt;
            const startTime = new Date(userProject.startedAt as any);
            let endTime = userProject?.endAt
              ? new Date(userProject?.endAt as any)
              : startTime;
            if (startTime == endTime) {
              endTime = new Date(
                startTime.getTime() + (emp.workTime || 1) * HOUR_TO_MS
              );
            }
            emp["endTime"] = endTime;
            const project = projectDetails?.find(
              (proj) =>
                proj?._id?.toString() == userProject?.projectId?.toString()
            );
            const rewards = project?.rewards[1];
            emp["resultCopyInfo"] = {
              images: [
                {
                  image: rewards.image,
                  description: rewards.description,
                },
              ],
              resultSummary: [
                {
                  title: rewards.rating,
                  type: " Rating",
                  icon: "military_medal.webp",
                },
                {
                  title: rewards.cash,
                  type: "K",
                  icon: "dollar_banknote.webp",
                },
              ],
            };
            var remainingTime = endTime.valueOf() - new Date().valueOf();
            const isCompleted = remainingTime < 0 ? true : false;
            if (isCompleted && emp.status != EMP_STATUS.COMPLETED) {
              emp.status = EMP_STATUS.COMPLETED;
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
      const { employeeId, projectId, workTime = 1 } = data;
      const addTime = workTime * HOUR_TO_MS;
      const projectObj = {
        userId: userIfExists._id,
        employeeId,
        projectId,
        status: EMP_STATUS.WORKING,
        startedAt: new Date(),
        completedAt: null,
        endAt: new Date(new Date().getTime() + addTime),
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
          {
            $inc: {
              cash: EMP_START_PROJECT_COST,
              "currentDayRewards.cash": EMP_START_PROJECT_COST,
            },
          }
        ),
      ]);
      return true;
    } catch (error) {
      throw new NetworkError("Error occurred starting the project", 400);
    }
  }

  /**
   * @description start a project for an employee
   * @param userIfExists
   * @param data
   * @returns {*}
   */
  public async completeProjectAndClaimReward(userIfExists: any, data: any) {
    try {
      let updatedObj = {};
      const { employeeId, resultCopyInfo } = data;
      const rewards = resultCopyInfo?.resultSummary;
      if (rewards) {
        updatedObj = {
          cash: rewards[1].title,
          "businessScore.current": rewards[0].title,
          "businessScore.operationsScore": rewards[0].title,
          "businessScore.growthScore": rewards[0].title,
          "businessScore.productScore": rewards[0].title,
        };
      }
      await Promise.all([
        UserProjectsTable.findOneAndUpdate(
          {
            userId: userIfExists._id,
            employeeId,
          },
          { $set: { status: EMP_STATUS.COMPLETED } }
        ),
        UserTable.findOneAndUpdate(
          { _id: userIfExists._id },
          {
            $inc: updatedObj,
          }
        ),
      ]);
      return true;
    } catch (error) {
      throw new NetworkError("Error occurred starting the project", 400);
    }
  }

  /**
   * @description format get employee list unlocked on event or stage completion
   * @param triggerId stageId or the eventId
   * @param triggerType stage or event
   * @returns {*}
   */
  public async getUnlockedEmployeeDetails(triggerId: any, triggerType: number) {
    try {
      let employees = [];
      const empDetails = await EmployeeLevelsTable.aggregate([
        {
          $match: {
            unlockTriggerId: new ObjectId(triggerId),
            unlockTriggerType: triggerType,
          },
        },
        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employeeDetails",
          },
        },
        {
          $unwind: {
            path: "$employeeDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            level: 1,
            promotionCost: 1,
            ratingValues: 1,
            title: 1,
            employeeDetails: 1,
          },
        },
      ]).exec();
      if (empDetails.length) {
        empDetails.forEach((emp) => {
          let tokens = emp.employeeDetails?.price;
          if (emp.level > 1) tokens = emp.promotionCost;
          employees.push({
            type: MILESTONE_HOMEPAGE.EMPLOYEE,
            employeeId: emp.employeeDetails._id,
            icon: emp.employeeDetails?.image,
            title: emp.employeeDetails?.name,
            level: emp.level,
            designation: emp?.title,
            employeeIcon: emp.employeeDetails?.icon,
            tokens,
          });
        });
      }
      return employees;
    } catch (error) {
      throw new NetworkError(error.message, 400);
    }
  }
}

export default new EmployeeDBService();
