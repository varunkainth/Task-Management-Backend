import express from "express";

import {
  OrganizationCreate,
  OrganizationUpdate,
  OrganizationDelete,
  AddMembersToOrg,
  RemoveMembersFromOrg,
  GetOrgMembers,
  SetPermissionsOfOrg,
  GetOrgPermissions,
  OrgSetting,
  ActiveOrDeactivateOrg,
  GetOrg,
} from "../controller/Organisation.js";
import {
  cacheValue,
  getCachedValue,
  deleteCachedValue,
} from "../config/redis.js";
import upload from "../middleware/multer.js";
import TokenVerify from "../middleware/TokenVerification.js";

const router = express.Router();

// Utility function to generate cache key
const generateCacheKey = (prefix, id) => `org:${prefix}:${id}`;

// Create Organization (with logo upload and caching)
router.post("/create", upload.single("logo"), TokenVerify,async (req, res) => {
  try {
    const result = await OrganizationCreate(req);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Cache the newly created organization
    const cacheKey = generateCacheKey("details", result._id);
    await cacheValue(cacheKey, JSON.stringify(result), 3600); // Cache for 1 hour

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update Organization (with logo upload and cache invalidation)
router.put("/update/:id", upload.single("logo"), TokenVerify,async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationUpdate(req);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Invalidate and update cache
    const detailsCacheKey = generateCacheKey("details", id);
    await deleteCachedValue(detailsCacheKey);
    await cacheValue(detailsCacheKey, JSON.stringify(result), 3600);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Organization (with cache invalidation)
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OrganizationDelete(req);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    // Remove from cache
    const detailsCacheKey = generateCacheKey("details", id);
    const membersCacheKey = generateCacheKey("members", id);
    const permissionsCacheKey = generateCacheKey("permissions", id);

    await Promise.all([
      deleteCachedValue(detailsCacheKey),
      deleteCachedValue(membersCacheKey),
      deleteCachedValue(permissionsCacheKey),
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get Organization with Caching
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = generateCacheKey("details", id);

    // Try to get from cache first
    const cachedOrg = await getCachedValue(cacheKey);
    if (cachedOrg) {
      return res.json(JSON.parse(cachedOrg));
    }

    // If not in cache, fetch from database
    const result = await GetOrg(req);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    // Cache the result
    await cacheValue(cacheKey, JSON.stringify(result), 3600);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get Organization Members with Caching
router.get("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = generateCacheKey("members", id);

    // Try to get from cache first
    const cachedMembers = await getCachedValue(cacheKey);
    if (cachedMembers) {
      return res.json(JSON.parse(cachedMembers));
    }

    // If not in cache, fetch from database
    const result = await GetOrgMembers(req);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    // Cache the result
    await cacheValue(cacheKey, JSON.stringify(result), 1800); // 30 minutes

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add Members to Organization (with cache invalidation)
router.post("/add-members/:id", TokenVerify,async (req, res) => {
  try {
    const result = await AddMembersToOrg(req);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Invalidate members cache
    const membersCacheKey = generateCacheKey("members", result.organization._id);
    await deleteCachedValue(membersCacheKey);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get Organization Permissions with Caching
router.get("/permissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = generateCacheKey("permissions", id);

    // Try to get from cache first
    const cachedPermissions = await getCachedValue(cacheKey);
    if (cachedPermissions) {
      return res.json(JSON.parse(cachedPermissions));
    }

    // If not in cache, fetch from database
    const result = await GetOrgPermissions(req);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    // Cache the result
    await cacheValue(cacheKey, JSON.stringify(result), 1800); // 30 minutes

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add these routes to the existing router or in the same route file

// Remove Members from Organization (with cache invalidation)
router.post("/remove-members/:id", async (req, res) => {
  try {
    const result = await RemoveMembersFromOrg(req);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Invalidate members cache for the organization
    const membersCacheKey = generateCacheKey("members", result.organization._id);
    await deleteCachedValue(membersCacheKey);

    // Optionally, invalidate org details cache as well
    const orgDetailsCacheKey = generateCacheKey("details", result.organization._id);
    await deleteCachedValue(orgDetailsCacheKey);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Set Organization Permissions (with caching)
router.post("/set-permissions", async (req, res) => {
  try {
    const result = await SetPermissionsOfOrg(req);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Cache the new permissions
    const permissionsCacheKey = generateCacheKey("permissions", result._id);
    await cacheValue(
      permissionsCacheKey,
      JSON.stringify(result.permissions),
      1800
    ); // 30 minutes

    // Invalidate org details cache
    const orgDetailsCacheKey = generateCacheKey("details", result._id);
    await deleteCachedValue(orgDetailsCacheKey);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update Organization Settings (with caching)
router.post("/update-settings", async (req, res) => {
  try {
    const result = await OrgSetting(req);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Cache the updated organization details
    const orgDetailsCacheKey = generateCacheKey("details", result._id);
    await deleteCachedValue(orgDetailsCacheKey);
    await cacheValue(orgDetailsCacheKey, JSON.stringify(result), 3600); // 1 hour

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Activate/Deactivate Organization (with caching)
router.post("/toggle-status", async (req, res) => {
  try {
    const result = await ActiveOrDeactivateOrg(req);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Update organization details cache
    const orgDetailsCacheKey = generateCacheKey("details", result._id);
    await deleteCachedValue(orgDetailsCacheKey);
    await cacheValue(orgDetailsCacheKey, JSON.stringify(result), 3600); // 1 hour

    // Additional cache invalidation if needed
    const membersCacheKey = generateCacheKey("members", result._id);
    const permissionsCacheKey = generateCacheKey("permissions", result._id);

    await Promise.all([
      deleteCachedValue(membersCacheKey),
      deleteCachedValue(permissionsCacheKey),
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
