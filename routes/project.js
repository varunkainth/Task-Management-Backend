import { Router } from "express";
import AdminCheck from "../middleware/CheckAdmin.js";
import {
  deleteAllUserProjects,
  deleteProject,
  getAllProject,
  getProjectById,
  ProjectCreate,
  updateProject
} from "../controller/Project.js";
import TokenVerify from "../middleware/TokenVerification.js";
import { cacheValue, getCachedValue, deleteCachedValue } from "../config/redis.js";

const router = Router();

// Create a project
router.post("/", TokenVerify, async (req, res) => {
  try {
    const newProject = await ProjectCreate(req, res);

    // Invalidate the cache for the project list
    await deleteCachedValue('allProjects');

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all projects
router.get("/", TokenVerify, async (req, res) => {
  try {
    const cacheKey = 'allProjects';
    const cachedProjects = await getCachedValue(cacheKey);

    // If cached projects exist, return them
    if (cachedProjects) {
      return res.status(200).json(JSON.parse(cachedProjects));
    }

    // Fetch projects from the database
    const projects = await getAllProject(); // Remove req, res parameters
    
    // Handle case where no projects are found
    if (!projects || projects.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404
    }

    // Ensure projects is serializable
    const serializedProjects = projects.map(project => ({
      id: project._id.toString(), // Ensure ID is converted to string
      name: project.name,
      description: project.description,
      createdBy: project.createdBy ? {
        id: project.createdBy._id?.toString(),
        name: project.createdBy.name
      } : null,
      members: project.members,
      invites: project.invites?.map(invitation => ({
        id: invitation._id?.toString(),
        email: invitation.email,
      })) || [],
      tasks: project.tasks?.map(task => ({
        id: task._id?.toString(),
        title: task.title,
      })) || [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    // Cache the serialized projects
    await cacheValue(cacheKey, JSON.stringify(serializedProjects), 3600);

    // Send the response
    return res.status(200).json(serializedProjects);

  } catch (error) {
    console.error('Error fetching all projects:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch projects',
      error: error.message 
    });
  }
});


// Get a project by ID
router.get("/:id", TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `project:${id}`;
    const cachedProject = await getCachedValue(cacheKey);

    if (cachedProject) {
      return res.status(200).json(JSON.parse(cachedProject));
    }

    const project = await getProjectById(req, res);

    await cacheValue(cacheKey, JSON.stringify(project), 3600); // Cache for 1 hour
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a project
router.put("/:id", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProject = await updateProject(req, res);

    // Invalidate cache after update
    await deleteCachedValue(`project:${id}`);
    await deleteCachedValue('allProjects'); // Invalidate the list cache

    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a project
router.delete("/:id", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProject(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue(`project:${id}`);
    await deleteCachedValue('allProjects'); // Invalidate the list cache

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete all projects for a user
router.delete("/users/", TokenVerify, AdminCheck, async (req, res) => {
  try {
    await deleteAllUserProjects(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue('allProjects'); // Invalidate the list cache

    res.status(200).json({ message: 'All user projects deleted successfully' });
  } catch (error) {
    console.error('Error deleting all user projects:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
