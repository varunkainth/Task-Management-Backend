import mongoose from "mongoose";
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

export const getAllProject = async () => {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name")
      .populate("tasks");

    return projects;
  } catch (error) {
    console.error("Get All Projects Error:", error);
    throw error; // Let the route handler catch this
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

export const updateProject = async (projectId, updateData) => {
  const { name, description } = updateData;

  if (!name && !description) {
    throw new Error("No fields provided for update");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (name) project.name = name;
  if (description) project.description = description;

  await project.save();

  // Return the updated project
  return {
    id: project._id,
    name: project.name,
    description: project.description,
    createdBy: project.createdBy,
    createdAt: project.createdAt,
    members: project.members,
    invites: project.invites,
    tasks: project.tasks
  };
};

export const deleteProject = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  // Check if the project has tasks or other dependencies
  if (project.tasks.length > 0) {
    throw new Error("Project has associated tasks and cannot be deleted");
  }

  // Use deleteOne() instead of remove() as remove() is deprecated
  await Project.deleteOne({ _id: projectId });

  // Update user's projects list
  await User.updateMany(
    { projects: projectId },
    { $pull: { projects: projectId } }
  );

  return {
    success: true,
    projectId
  };
};

export const deleteAllUserProjects = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    // Fetch the user with session
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // Check project count efficiently instead of fetching all projects
    const projectCount = await Project.countDocuments({ createdBy: userId });

    if (projectCount === 0) {
      await session.abortTransaction();
      return res.status(404).json({ message: "No projects found for the user" });
    }

    // Delete all projects within the transaction
    const deleteResult = await Project.deleteMany(
      { createdBy: userId },
      { session }
    );

    if (!deleteResult.acknowledged) {
      await session.abortTransaction();
      return res.status(500).json({ message: "Failed to delete projects" });
    }

    // Update user role and clear projects array within the transaction
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          role: "Member", 
          projects: [] 
        } 
      },
      { 
        new: true,
        session,
        runValidators: true
      }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      return res.status(500).json({ message: "Failed to update user role" });
    }

    // Commit the transaction if everything succeeded
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "All projects deleted and user role updated to Member",
      user: updatedUser,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Delete All User Projects Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to delete projects and update user role",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};
