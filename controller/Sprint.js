import Sprint from "../models/Sprint";

export const CreateSprint = async (req) => {
  try {
    const { name, startDate, endDate, status, goal } = req.body;
    const { projectId } = req.params;
    const sprint = await Sprint.create({
      name,
      startDate,
      endDate,
      status,
      goal,
      projectId,
    });
    return sprint;
  } catch (error) {
    return error;
  }
};

export const GetSprint = async (req) => {
  try {
    const { id } = req.params;
    const sprint = await Sprint.findById(id);
    return sprint;
  } catch (error) {
    return error;
  }
};

export const UpdateSprint = async (req) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, status, goal } = req.body;
    const sprint = await Sprint.findById(id);
    if (name) {
      sprint.name = name;
    }
    if (startDate) {
      sprint.startDate = startDate;
    }
    if (endDate) {
      sprint.endDate = endDate;
    }
    if (status) {
      sprint.status = status;
    }
    if (goal) {
      sprint.goal = goal;
    }
    await sprint.save();
    return sprint;
  } catch (error) {
    return error;
  }
};

export const DeleteSprint = async (req) => {
  try {
    const { id } = req.params;
    await Sprint.findByIdAndDelete(id);
    return { message: "Sprint deleted successfully" };
  } catch (error) {
    return error;
  }
};


