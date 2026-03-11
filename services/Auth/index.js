import bcrypt from "bcrypt";
import {
  generateJWTToken,
  generateJWTTokenForgotPassForms,
} from "../../middlewares/jwt.js";
import jwt from "jsonwebtoken";
import { sendNotification } from "../../middlewares/notifications.js";
import { authDetails, transporter } from "../../middlewares/nodemailer.js";
import { AdminModel } from "../../schemas/Admin.Schema.js";
import { SellerModel } from "../../schemas/Seller.Schema.js";
import { encryptFormData } from "../../middlewares/crypto-js.js";

// Login Function
export const login = async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    let account = null;

    // Check Admin first
    account = await AdminModel.findOne({ email });

    // If not admin, check seller
    if (!account) {
      account = await SellerModel.findOne({ email });
    }

    if (!account) {
      return res.status(404).json({
        message: "Email or password incorrect.",
      });
    }

    // Check account lock (works if field exists)
    if (account.lockedUntil && account.lockedUntil > Date.now()) {
      return res.status(403).json({
        message: "Your account is locked. Try again later.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

    if (!isPasswordValid) {
      // Increase failed attempts
      account.failedAttempts = (account.failedAttempts || 0) + 1;

      if (account.failedAttempts >= 5) {
        account.lockedUntil = new Date(Date.now() + LOCK_TIME_MS);
      }

      await account.save();

      return res.status(400).json({
        message: "Email or password incorrect.",
      });
    }

    // Reset attempts on successful login
    account.failedAttempts = 0;
    account.lockedUntil = null;
    account.lastLoginAt = new Date();
    account.lastLoginDevice = userAgent;

    await account.save();

    // Generate token
    const token = generateJWTToken({
      id: account._id.toString(),
      role: account.role,
    });

    // Cookies
    res.cookie("secureToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("role", account.role, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Remove password
    const { password: _, ...userData } = account._doc;

    return res.status(200).json({
      message: "Login successful",
      role: account.role,
      user: userData,
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

//Update Password Function
export const updatePassword = async (req, res) => {
  const { id, role } = req.user; // decoded from token or middleware
  const { email, oldPassword, newPassword } = req.body;

  try {
    let findUser = null;

    // Check Admin or Seller based on role
    if (role === "admin") {
      findUser = await AdminModel.findOne({ email });
    } else if (role === "seller") {
      findUser = await SellerModel.findOne({ email });
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    // User existence check
    if (!findUser) {
      return res.status(404).json({ message: "User not found for the given email." });
    }

    // Ensure the user ID from token matches the found user (security check)
    if (findUser._id.toString() !== id) {
      return res.status(403).json({ message: "Unauthorized user" });
    }

    // Check if user is active
    if (!findUser.status) {
      return res.status(403).json({ message: "User account is inactive. Please contact support." });
    }

    // Check old password correctness
    const isMatch = await bcrypt.compare(oldPassword, findUser.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Old password is incorrect" });
    }

    // Prevent reuse of old password
    const isSamePassword = await bcrypt.compare(newPassword, findUser.password);
    if (isSamePassword) {
      return res.status(403).json({
        message: "New password cannot be the same as the old password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and optionally first_login flag
    const updateFields = {
      password: hashedPassword,
    };
    if (findUser.first_login) {
      updateFields.first_login = false;
    }

    // Update in DB
    if (role === "admin") {
      await AdminModel.findByIdAndUpdate(findUser._id, updateFields);
    } else if (role === "seller") {
      await SellerModel.findByIdAndUpdate(findUser._id, updateFields);
    }

    return res.status(200).json({ message: "Password Updated Successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//Send Reset Password Function
export const sendMailWithResetPasswordLink = async (req, res) => {
  const { email } = req.body;

  try {
    let findUser = null;

    // 1) Check Admin
    findUser = await AdminModel.findOne({ email });

    // 2) Check Seller if not Admin
    if (!findUser) {
      findUser = await SellerModel.findOne({ email });
    }

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const token = generateJWTTokenForgotPassForms({
      id: findUser._id,
      role: findUser.role,
    });

    const resetPasswordLink = `${process.env.CORS_ORIGIN}/forgot-password?userName=${findUser.email}&token=${token}`;

    // Send email
    // await transporter.sendMail({
    //   from: authDetails.admin,
    //   to: findUser.email,
    //   subject: `🔑 Your Account Password Reset Link`,
    //   html: `
    //     <!DOCTYPE html>
    //     <html>
    //     <head><title>Password Reset</title></head>
    //     <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    //       <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    //         <h2 style="color: #2e7d32;">🔐 Password Reset</h2>
    //         <p>Hello <strong>${findUser.first_name || "User"}</strong>,</p>
    //         <p>To reset your account password, please use the link below:</p>
    //         <p><a href="${resetPasswordLink}" style="color: #1e88e5; text-decoration: none;">🔗 Reset Password</a></p>
    //         <p><strong>This link is valid for 1 hour only.</strong></p>
    //         <p>Your login information is as follows:</p>
    //         <ul><li><strong>Username:</strong> ${findUser.email}</li></ul>
    //         <p><strong>⚠️ Please keep this information confidential.</strong></p>
    //         <p>Team Support</p>
    //       </div>
    //     </body>
    //     </html>
    //   `,
    // });

    return res.status(200).json({ message: "Mail sent successfully" });
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

//Forgot Password Function
export const forgotPassword = async (req, res) => {
  const { role } = req.user; // role from decoded token
  const { email, newPassword } = req.body;

  try {
    let findUser = null;

    // Check Admin first
    if (role === "admin") {
      findUser = await AdminModel.findOne({ email });
    } else if (role === "seller") {
      findUser = await SellerModel.findOne({ email });
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    if (!findUser) {
      return res.status(404).json({ message: "User not found for the given email." });
    }

    // Ensure role matches
    if (findUser.role !== role) {
      return res.status(403).json({ message: "Invalid user" });
    }

    // Check if account is active
    if (!findUser.status) {
      return res
        .status(403)
        .json({ message: "User account is inactive. Please contact support." });
    }

    // Prevent reuse of old password
    const isSamePassword = await bcrypt.compare(newPassword, findUser.password);
    if (isSamePassword) {
      return res.status(403).json({
        message: "New password cannot be the same as the old password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateFields = { password: hashedPassword };
    if (findUser.first_login) {
      updateFields.first_login = false;
    }

    if (role === "admin") {
      await AdminModel.findByIdAndUpdate(findUser._id, updateFields, { new: true });
    } else if (role === "seller") {
      await SellerModel.findByIdAndUpdate(findUser._id, updateFields, { new: true });
    }

    return res.status(200).json({ message: "Password Updated Successfully" });
  } catch (error) {
    console.error("Error updating password in forgotPassword:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//Check Login/User Function
export const isAuthentication = (req, res, next) => {
  const cookies = req.cookies;
  try {
    const { secureToken, role } = cookies;

    // check token & role
    if (!secureToken || !role)
      return res.status(401).json({ message: "User Not Authorized" });

    jwt.verify(secureToken, process.env.SECRETE_KEY, async (err, decoded) => {
      if (err || !decoded)
        return res.status(403).json({ message: "Token is not valid" });

      const { id, role } = decoded;
      let trial_or_subscribed;

      let checkUser;

      if (role === "admin") {
        checkUser = await AdminModel.findById(id);
      } else if (role === "seller") {
        checkUser = await SellerModel.findById(id);
      } else {
        return res.status(403).json({ message: "Invalid role type" });
      }

      if (!checkUser) {
        return res.status(404).json({ message: "Account not found" });
      }

      const userObj = checkUser.toObject();
      const { password, ...userInfo } = userObj;
      userInfo.trial_or_subscribed = trial_or_subscribed;
      // const encryptedData = encryptFormData(userInfo);

      return res.status(200).json({ userInfo });
    });
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

export const isSeller = (req, res, next) => {
  if (req.user.role !== "seller") {
    return res.status(403).json({ message: "Forbidden: Sellers only" });
  }
  next();
};

export const isAdminOrSeller = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "seller") {
    return res.status(403).json({ message: "Forbidden: Admin or Seller only" });
  }
  next();
};

export const logoutReq = async (req, res) => {
  try {
    // Clear auth cookies
    res.clearCookie("secureToken", { httpOnly: true, secure: true, sameSite: "Strict" });
    res.clearCookie("role", { httpOnly: true, secure: true, sameSite: "Strict" });

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "An error occurred while logging out" });
  }
};

