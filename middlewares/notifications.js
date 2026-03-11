import { notificationModel } from "../schemas/Users.Schema.js";

export const sendNotification = async ({
  title,
  message,
  recipientType, // "all" | "user" | "law_firm" | "lawyer"
  recipientModel = null, // "User" | "LawFirms" | "Lawyers"
  recipientId = null, // single id
  recipients = [], // array of ids
  io = null, // socket instance optional
}) => {
  try {
    const newNotification = new notificationModel({
      title,
      message,
      recipientType,
      recipientModel,
      recipientId,
      recipients,
    });

    await newNotification.save();

    if (io) {
      // Case: notify ALL USERS, LAW FIRMS, LAWYERS
      if (recipientType === "all") {
        io.emit("notification:all", newNotification);
      }

      // Case: notify SINGLE MODEL USER
      else if (recipientModel && recipientId) {
        const room = `${recipientModel}_${recipientId}`;
        io.to(room).emit("notification:new", newNotification);
      }

      // Case: notify MULTIPLE RECIPIENTS
      else if (recipients.length > 0 && recipientModel) {
        recipients.forEach((id) => {
          const room = `${recipientModel}_${id}`;
          io.to(room).emit("notification:new", newNotification);
        });
      }
    }

    return newNotification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
