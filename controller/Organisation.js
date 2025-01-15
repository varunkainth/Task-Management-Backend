import cloudinary from "../config/Cloudinary.js";
import Organization from "../models/Organisation.js";

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
    admin: req.user._id,
  });
  try {
    if (urlPath) {
      newOrganization.logo = urlPath.secure_url;
    }
    const savedOrganization = await newOrganization.save();
    return savedOrganization;
  } catch (error) {
    console.log(error);
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
    return "Delete SuccessFully ";
  } catch (error) {
    return { error: "Error deleting organization" };
  }
};

export const AddMembersToOrg = async (req) => {
  try {
    const { id } = req.params;
    const { members } = req.body;

    // Validate input
    if (!Array.isArray(members) || members.some(member => !member._id)) {
      return { error: "Invalid members data" };
    }

    // Find the organization
    const org = await Organization.findById(id);
    if (!org) {
      return { error: "Organization not found" };
    }

    // Convert existing members to a Set for efficient lookup
    const existingMemberIds = new Set(org.members.map(member => member.toString()));

    // Separate new and already added members
    const membersToAdd = [];
    const alreadyAddedMembers = [];

    members.forEach(member => {
      const memberId = member._id.toString();

      if (existingMemberIds.has(memberId)) {
        alreadyAddedMembers.push(member);
      } else {
        membersToAdd.push(memberId);
        existingMemberIds.add(memberId);
      }
    });

    // Update organization with new members
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { $addToSet: { members: { $each: membersToAdd } } },
      { new: true }
    );

    if (!updatedOrg) {
      return { error: "Error updating the organization with new members." };
    }

    // Populate members with selected fields
    const populatedOrg = await updatedOrg.populate("members", "name email");

    return {
      organization: populatedOrg,
      addedMembers: membersToAdd.length,
      alreadyAddedMembers: alreadyAddedMembers.map(member => ({
        _id: member._id,
        name: member.name
      }))
    };
  } catch (error) {
    console.error("Error in AddMembersToOrg:", error);
    return { error: "Internal server error. Please try again later." };
  }
};


export const RemoveMembersFromOrg = async (req) => {
  try {
    const { id } = req.params;
    const { members } = req.body;

    // Validate input
    if (!Array.isArray(members) || members.some((member) => !member._id)) {
      return { error: "Invalid members data" };
    }

    // Extract member IDs to remove
    const membersToRemove = members.map((member) => member._id);

    // Update organization to remove members
    const updatedOrg = await Organization.findByIdAndUpdate(
      id,
      { $pull: { members: { $in: membersToRemove } } },
      { new: true }
    );

    if (!updatedOrg) {
      return { error: "Error removing members from organization" };
    }

    // Populate updated organization with selected member fields
    const populatedOrg = await updatedOrg.populate("members", "name email");

    return {
      message: "Members removed successfully",
      organization: populatedOrg,
      removedMembers: membersToRemove,
    };
  } catch (error) {
    console.error("Error in RemoveMembersFromOrg:", error);
    return { error: "Internal server error. Please try again later." };
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
