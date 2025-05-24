const userRepository = require("../../repositories/user.repository");
const CustomError = require("../../helpers/customError");

const getAllUsers = async (req) => {
  const { page = 1, limit = 10 } = req.query;
  const { records, total } = await userRepository.findAllPaginated({
    page,
    limit,
  });
  return { users: records, total };
};

const getUserById = async (req) => {
  const { id } = req.params;
  const record = await userRepository.findById(id);

  if (!record) {
    throw new CustomError({
      message: "User not found",
      statusCode: 404,
    });
  }

  return {
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      is_active: record.is_active,
      createdAt: record.createdAt,
    },
  };
};

const updateUser = async (req) => {
  const { id } = req.params;
  const { name, role } = req.body;

  const existing = await userRepository.findById(id);
  if (!existing) {
    throw new CustomError({
      message: "User not found",
      statusCode: 404,
    });
  }

  // Users can only update their own profile unless they're admin+
  if (req.user.id !== id && !["admin", "superAdmin"].includes(req.user.role)) {
    throw new CustomError({
      message: "Forbidden: You can only update your own profile",
      statusCode: 403,
    });
  }

  const updated = await userRepository.update(id, {
    name: name || existing.name,
    role: role || existing.role,
  });

  return {
    message: "User updated successfully",
    user: updated,
  };
};

// Only superadmin can delete users
const deleteUser = async (req) => {
  const { id } = req.params;
  const existing = await userRepository.findById(id);

  if (!existing) {
    throw new CustomError({
      message: "User not found",
      statusCode: 404,
    });
  }

  await userRepository.delete(id);
  return { message: "User deleted successfully" };
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
