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
    const projects = await getAllProject(); // Fetch projects from DB
    
    // Handle case where no projects are found
    if (!projects || projects.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404
    }

    // Serialize projects to ensure they are JSON-safe
    const serializedProjects = projects.map(project => ({
      id: project._id.toString(), // Ensure ID is converted to string
      name: project.name,
      description: project.description || null, // Handle potentially null description
      createdBy: project.createdBy ? {
        id: project.createdBy._id?.toString(),
        name: project.createdBy.name || null // Ensure createdBy.name is safe
      } : null,
      members: project.members || [], // Ensure members is an array
      invites: project.invites?.map(invitation => ({
        id: invitation._id?.toString(),
        email: invitation.email || null, // Ensure email is safe
      })) || [],
      tasks: project.tasks?.map(task => ({
        id: task._id?.toString(),
        title: task.title || null, // Ensure title is safe
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
    // Ensure we don't attempt to send a response more than once
    return res.status(500).json({ 
      message: 'Failed to fetch projects',
      error: error.message 
    });
  }
});


// Get a project by ID
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return; // Omit circular reference
      }
      seen.add(value);
    }
    return value;
  });
};

router.get("/:id", TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `project:${id}`;
    const cachedProject = await getCachedValue(cacheKey);

    if (cachedProject) {
      return res.status(200).json(JSON.parse(cachedProject));
    }

    // Get project without passing `req` and `res`
    const project = await getProjectById(id);

    // Use safeStringify to handle circular references
    await cacheValue(cacheKey, safeStringify(project), 3600); // Cache for 1 hour
    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project by ID:", error);

    // Check if headers are already sent to prevent ERR_HTTP_HEADERS_SENT
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});


// Update a project
router.put("/:id", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Pass only the necessary data to the controller
    const updatedProject = await updateProject(id, req.body);

    // Invalidate cache after update
    await deleteCachedValue(`project:${id}`);
    await deleteCachedValue('allProjects');

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    
    // Handle specific error cases
    if (error.message === "No fields provided for update") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Project not found") {
      return res.status(404).json({ message: error.message });
    }
    
    // Default error response
    res.status(500).json({ 
      message: 'Failed to update project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a project
router.delete("/:id", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    
    await deleteProject(id);

    // Invalidate cache after deletion
    await deleteCachedValue(`project:${id}`);
    await deleteCachedValue('allProjects');

    return res.status(200).json({ 
      success: true,
      message: 'Project deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    
    // Handle specific error cases
    if (error.message === "Project not found") {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (error.message === "Project has associated tasks and cannot be deleted") {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    // Default error response
    return res.status(500).json({ 
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete("/delete/all", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const result = await deleteAllUserProjects(req.user._id);
    
    if (result.success) {
      // Invalidate cache after successful deletion
      await deleteCachedValue('allProjects');
      return res.status(200).json(result);
    } else {
      return res.status(result.status).json({ message: result.message });
    }
  } catch (error) {
    console.error('Error deleting all user projects:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
