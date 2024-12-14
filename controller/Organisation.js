import cloudinary from "../config/Cloudinary";
import Organization from "../models/Organisation";

export const OrganizationCreate = async (req) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return { error: "Please fill in all fields" };
  }
  // Logo From Multer Save in Cloudinary

  const logoPath = req.file?.path;

  const urlPath = await cloudinary.v2.uploader.upload(logoPath);

  const newOrganization = new Organization({
    name,
    description,
  });
  try {
    if (urlPath) {
      newOrganization.logo = urlPath.secure_url;
    }
    const savedOrganization = await newOrganization.save();
    return savedOrganization;
  } catch (error) {
    return { error: "Error creating organization" };
  }
};

export const OrganizationUpdate = async (req) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;
    if (!name || !description) {
      return { error: "Please fill in all fields" };
    }
    // Logo From Multer Save in Cloudinary
    const logoPath = req.file?.path;
    const urlPath = await cloudinary.v2.uploader.upload(logoPath);
    const updatedOrganization = await Organization.findByIdAndUpdate(
      id,
      {
        name,
        description,
        logo: urlPath?.secure_url,
      },
      { new: true }
    );
    if (!updatedOrganization) {
      return { error: "Organization not found" };
    }
    return updatedOrganization;
  } catch (error) {
    return { error: "Error updating organization" };
  }
};

export const OrganizationDelete = async (req) => {
  try {
    const { id } = req.params;
    const deletedOrganization = await Organization.findByIdAndDelete(id);
    if (!deletedOrganization) {
      return { error: "Organization not found" };
    }
    return deletedOrganization;
  } catch (error) {
    return { error: "Error deleting organization" };
  }
};

export const AddMembersToOrg = async (req) => {
  try {
    const { id, members } = req.body;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    const membersToAdd = members.map((member) => member._id);
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { members: [...org.members, ...membersToAdd] },
      { new: true }
    );
    if (!updatedOrg) {
      return { error: "Error adding members to organization" };
    }
    return updatedOrg;
  } catch (error) {
    return { error: "Error adding members to organization" };
  }
};

export const RemoveMembersFromOrg = async (req) => {
  try {
    const { id, members } = req.body;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    const membersToRemove = members.map((member) => member._id);
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { members: org.members.filter((m) => !membersToRemove.includes(m._id)) },
      { new: true }
    );
    if (!updatedOrg) {
      return { error: "Error removing members from organization" };
    }
    return updatedOrg;
  } catch (error) {
    return { error: "Error removing members from organization" };
  }
};

export const GetOrgMembers = async (req) => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    return org.members;
  } catch (error) {
    return { error: "Error getting organization members" };
  }
};

export const SetPermissionsOfOrg = async (req) => {
  const { id, permissions } = req.body;
  try {
    const org = await Organization.findOne();
    if (!org) {
      return { error: "Organization not found" };
    }
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { permissions: permissions },
      { new: true }
    );
    if (!updatedOrg) {
      return { error: "Error setting permissions of organization" };
    }
    return updatedOrg;
  } catch (error) {
    return { error: "Error setting permissions of organization" };
  }
};

export const GetOrgPermissions = async (req) => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    return org.permissions;
  } catch (error) {
    return { error: "Error getting organization permissions" };
  }
};

export const OrgSetting = async (req) => {
  try {
    const { id, setting } = req.body;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { setting: setting },
      { new: true }
    );
    if (!updatedOrg) {
      return { error: "Error setting organization setting" };
    }
    return updatedOrg;
  } catch (error) {
    return { error: "Error setting organization setting" };
  }
};

export const ActiveOrDeactivateOrg = async (req) => {
  try {
    const { id, status } = req.body;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      {
        deactivatedAt: new Date.now(),
        isActive: false,
      },
      { new: true }
    );
    if (!updatedOrg) {
      return { error: "Error activating/deactivating organization" };
    }
    return updatedOrg;
  } catch (error) {
    return { error: "Error activating/deactivating organization" };
  }
};

export const GetOrg = async (req) => {
  try {
    const { id } = req.params;
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }
    return org;
  } catch (error) {
    return { error: "Error getting organization" };
  }
};
