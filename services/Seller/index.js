import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { sendNotification } from "../../middlewares/notifications.js";
import { AdminModel } from "../../schemas/Admin.Schema.js";
import { SellerModel } from "../../schemas/Seller.Schema.js";
import { encryptFormData } from "../../middlewares/crypto-js.js";

// Add Seller Function
export const addSellerByAdmin = async (req, res) => {
  const { id: adminId } = req.user; // Admin creating the seller

  try {
    const {
      first_name,
      last_name,
      email,
      password,
      jurisdiction,
      mobile_no,
      country,
      state,
      skills,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !jurisdiction || !mobile_no || !country || !state) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Verify the requesting user is an Admin
    const adminUser = await AdminModel.findById(adminId);
    if (!adminUser) return res.status(404).json({ message: "Admin not found." });
    if (adminUser.role !== "admin")
      return res.status(403).json({ message: "Access denied! Only Admin can add a seller." });

    // Check if email is already in use
    const existingSeller = await SellerModel.findOne({ email });
    if (existingSeller) return res.status(400).json({ message: "Email already in use." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Seller
    const seller = new SellerModel({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      jurisdiction,
      mobile_no,
      country,
      state,
      skills: skills || [],
      role: "seller",
      status: true,
      createdBy: adminId, // Reference to admin
    });

    await seller.save();

    // Send notification and email (your existing code)
    // await sendNotification({
    //   title: "Seller Account Created",
    //   message: "A new seller account has been created.",
    //   recipientType: "seller",
    //   recipientModel: "Seller",
    //   recipientId: seller._id,
    //   io: req.app.get("io"),
    // });

    // Send credentials via email
    // await transporter.sendMail({
    //   from: authDetails.admin,
    //   to: email,
    //   subject: "Welcome to Product Management! Your Seller Account",
    //   html: `
    //     <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    //       <h2 style="color: #2e7d32;">Welcome to Product Management!</h2>
    //       <p>Hello <strong>${first_name}</strong>,</p>
    //       <p>Your seller account has been successfully created for the ${jurisdiction} jurisdiction.</p>
    //       <p><strong>Login Credentials:</strong></p>
    //       <ul>
    //         <li>Email: ${email}</li>
    //         <li>Password: ${password}</li>
    //       </ul>
    //       <p>Please change your password after your first login.</p>
    //       <p>Best regards,<br><strong>Team Product Management</strong></p>
    //     </div>
    //   `,
    // });

    // Return response 
    const { password: _, ...sellerData } = seller._doc;

    return res.status(201).json({
      message: "Seller created successfully",
      seller: sellerData,
    });
  } catch (error) {
    console.error("Error creating seller:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get All Seller Function 
export const getAllSellers = async (req, res) => {
  console.log("calling");

  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    // Search filter
    const searchFilter = search
      ? {
        $or: [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    const totalSellers = await SellerModel.countDocuments(searchFilter);

    const sellers = await SellerModel.find(searchFilter)
      .select("-password -twoFACode")
      .populate("createdBy", "email role")
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Seller list fetched successfully",
      pagination: {
        total: totalSellers,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalSellers / pageSize),
      },
      sellers,
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// Get Seller By ID
export const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await SellerModel.findById(id)
      .select("-password -twoFACode")
      .populate("createdBy", "email role");

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    return res.status(200).json({
      message: "Seller fetched successfully",
      seller,
    });

  } catch (error) {
    console.error("Error fetching seller:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

//Update Seller Profile Data 
export const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        message: "Invalid seller ID"
      });
    }

    const seller = await SellerModel.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found.."
      });
    }

    const {
      first_name,
      last_name,
      email,
      password,
      jurisdiction,
      mobile_no,
      country,
      state,
      skills
    } = req.body;

    // Email check
    if (email && email !== seller.email) {

      const existingSeller = await SellerModel.findOne({ email });

      if (existingSeller) {
        return res.status(409).json({
          message: "Email already in use"
        });
      }
      seller.email = email.trim();
    }

    if (first_name) seller.first_name = first_name.trim();
    if (last_name) seller.last_name = last_name.trim();
    if (jurisdiction) seller.jurisdiction = jurisdiction;
    if (mobile_no) seller.mobile_no = mobile_no;
    if (country) seller.country = country;
    if (state) seller.state = state;

    if (skills) {

      if (!Array.isArray(skills)) {
        return res.status(400).json({
          message: "Skills must be an array"
        });
      }
      seller.skills = skills;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      seller.password = hashedPassword;
    }

    await seller.save();

    const { password: _, twoFACode, ...sellerData } = seller._doc;

    return res.status(200).json({
      message: "Seller profile updated successfully",
      seller: sellerData
    });

  } catch (error) {
    console.error("Error updating seller profile:", error);
    return res.status(500).json({
      message: "Server error"
    });

  }
};


