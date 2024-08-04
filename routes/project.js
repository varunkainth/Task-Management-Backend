// routes/project.js
import { Router } from "express";
import AdminCheck from "../middleware/CheckAdmin.js";
import {
  deleteAllUserProjects,
  deleteProject,
  getAllProject,
  getProjectById,
  ProjectCreate,
  updateProject,
} from "../controller/Project.js";
import TokenVerify from "../middleware/TokenVerification.js";
import { cacheValue, getCachedValue, deleteCachedValue } from '../config/redis.js';

const router = Router();

// Create a project
router.post("/projects", TokenVerify, ProjectCreate);

// Get all projects
router.get("/projects", TokenVerify, async (req, res) => {
  try {
    const cacheKey = 'allProjects';
    const cachedProjects = await getCachedValue(cacheKey);

    if (cachedProjects) {
      return res.status(200).json(JSON.parse(cachedProjects));
    }

    const projects = await getAllProject(req, res);

    await cacheValue(cacheKey, JSON.stringify(projects), 3600); // Cache for 1 hour
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get a project by ID
router.get("/projects/:id", TokenVerify, async (req, res) => {
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
router.put("/projects/:id", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    await updateProject(req, res);

    // Invalidate cache after update
    await deleteCachedValue(`project:${id}`);
    await deleteCachedValue('allProjects'); // Invalidate the list cache
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a project
router.delete("/projects/:id", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProject(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue(`project:${id}`);
    await deleteCachedValue('allProjects'); // Invalidate the list cache
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete all projects for a user
router.delete(
  "/users/projects",
  TokenVerify,
  AdminCheck,
  async (req, res) => {
    try {
      await deleteAllUserProjects(req, res);

      // Invalidate cache after deletion
      await deleteCachedValue('allProjects'); // Invalidate the list cache
    } catch (error) {
      console.error('Error deleting all user projects:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
);

export default router;
