import { PERMISSIONS } from "../permissions.js";
import { AdminModel } from "../schemas/Admin.Schema.js";
import { SellerModel } from "../schemas/Seller.Schema.js";

export const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ message: "Role missing" });
    }

    const rolePermissions = PERMISSIONS[userRole];

    if (!rolePermissions) {
      return res.status(403).json({ message: "Invalid role" });
    }

    const isAllowed = rolePermissions[permissionKey];

    if (!isAllowed) {
      return res.status(403).json({
        message: `Access denied. Permission '${permissionKey}' required.`,
      });
    }

    next();
  };
};

export const checkEmailExistsGlobally = async (email) => {
  const Admin = await AdminModel.findOne({ email });
  if (Admin) return "admin";

  const Seller = await SellerModel.findOne({ email });
  if (Seller) return "seller";

  return null;
};
