import Project from "../models/Project.js";
import User from "../models/User.js";

export const ProjectCreate = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user._id;

    if (!name || !createdBy) {
      return res.status(400).json({ message: "Name and creator are required" });
    }

    const project = new Project({
      name,
      description,
      createdBy,
    });

    await project.save();

    // Update user with the new project
    await User.findByIdAndUpdate(
      createdBy,
      {
        $push: { projects: project._id },
        role: "Admin",
      },
      { new: true }
    );

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name")
      .exec();

    return res.status(201).json({
      project: populatedProject,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Project Create Error:", error);
    return res.status(500).json({ message: "Failed to create project" });
  }
};

export const getAllProject = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name")
      .populate("tasks");

    if (projects.length === 0) {
      return res.status(404).json({ message: "No projects found" });
    }

    return res.status(200).json(projects);
  } catch (error) {
    console.error("Get All Projects Error:", error);
    return res.status(500).json({ message: "Failed to retrieve projects" });
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
    console.error("Get Project By Id Error:", error);
    return res.status(500).json({ message: "Failed to retrieve project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, description } = req.body;

    if (!name && !description) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (name) project.name = name;
    if (description) project.description = description;

    await project.save();

    return res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Update Project Error:", error);
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

    // Check if the project has tasks or other dependencies
    if (project.tasks.length > 0) {
      return res.status(400).json({ message: "Project has associated tasks and cannot be deleted" });
    }

    await project.remove();

    // Update user's projects list
    await User.updateMany(
      { projects: projectId },
      { $pull: { projects: projectId } }
    );

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ message: "Failed to delete project" });
  }
};

export const deleteAllUserProjects = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch all projects created by the user
    const projects = await Project.find({ createdBy: userId });

    if (projects.length > 0) {
      // Delete all projects
      await Project.deleteMany({ createdBy: userId });

      // Update the user's role
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { role: "Member", projects: [] } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }

      return res.status(200).json({
        message: "All projects deleted and user role updated to Member",
        user: updatedUser,
      });
    } else {
      return res.status(404).json({ message: "No projects found for the user" });
    }
  } catch (error) {
    console.error("Delete All User Projects Error:", error);
    return res.status(500).json({ message: "Failed to delete projects and update user role" });
  }
};
