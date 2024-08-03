import Project from "../models/Project.js";
import User from "../models/User.js";

export const ProjectCreate = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user._id;
    if (!name || !createdBy) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    const project = await Project.create({ name, createdBy });
    if (!project) {
      return res.status(500).json({ message: "Failed to create project" });
    }
    if (description) {
      project.description = description;
    }
    await project.save();

    await User.findByIdAndUpdate(
      createdBy,
      {
        $push: { projects: project._id },
        role: "Admin",
      },
      {
        new: true,
      }
    );
    const ProjectCreated = await Project.findById(project._id).populate(
      "createdBy",
      "name"
    );
    return res.status(201).json({
      project: ProjectCreated,
      message: "Project created successfully",
    });
  } catch (error) {
    console.log("Project Create Error : ", error);
    return res.status(500).json({ message: "Failed to create project" });
  }
};
export const getAllProject = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name")
      .populate("tasks");
    if (!projects) {
      return res.status(404).json({ message: "No projects found" });
    }
    return res.status(200).json(projects);
  } catch (Err) {
    console.log("Get All Project Error : ", Err);
    return res.status(500).json({ message: Err.message });
  }
};
export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId)
      .populate("createdBy", "name")
      .populate("tasks");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.status(200).json(project);
  } catch (error) {
    console.log("Get Project By Id Error : ", error);
    return res.status(500).json({ message: "Failed to get project" });
  }
};
export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description } = req.body;
    if (!name && !description) {
      return res
        .status(400)
        .json({ message: "Please fill at least one field" });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (name) {
      project.name = name;
    }
    if (description) {
      project.description = description;
    }
    await project.save();
    return res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    console.log("Update Project Error : ", error);
    return res.status(500).json({ message: "Failed to update project" });
  }
};
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    await project.remove();
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log("Delete Project Error : ", error);
    return res.status(500).json({ message: "Failed to delete project" });
  }
};

export const deleteAllUserProjects = async (req, res) => {
  try {
    const userId = req.user._id; // Assumes user ID is available in req.user

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch and delete all projects associated with the user
    const projects = await Project.find({ createdBy: userId });
    if (projects.length > 0) {
      await Project.deleteMany({ createdBy: userId });
    }

    // Update the user's role to "Member" if they have no projects left
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role: "Member" } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user role" });
    }

    return res.status(200).json({
      message: "All projects deleted and user role updated to Member",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Delete All User Projects Error:", error);
    return res
      .status(500)
      .json({
        message:
          "An error occurred while deleting projects and updating user role",
      });
  }
};
