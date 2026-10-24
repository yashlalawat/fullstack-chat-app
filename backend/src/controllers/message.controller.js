import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { io , getReceiverSocketId } from "../lib/socket.js";

export const getUsersForSidebar = async (req , res) => {
    try {
        const loggedInUserId = req.user._id;
        const fileterdUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        //find all the users but not the currently logged in user 
        //fetch everything except the password

        res.status(200).json(fileterdUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
};

export const getMessages = async (req , res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ],
            deletedForEveryone: { $ne: true },
            deletedFor: { $nin: [myId] }
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
  try {
    const {
      text,
      fileData,
      fileName,
      fileType,
      fileSize,
    } = req.body;

    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text?.trim() && !fileData) {
      return res.status(400).json({
        message: "A message or attachment is required",
      });
    }

    // Match the frontend's 10 MB attachment limit.
    if (fileSize && fileSize > 10 * 1024 * 1024) {
      return res.status(413).json({
        message: "File size must be 10 MB or less",
      });
    }

    let imageUrl = "";
    let fileUrl = "";

    if (fileData) {
      if (typeof fileData !== "string" ||
          !fileData.startsWith("data:")) {
        return res.status(400).json({
          message: "Invalid attachment data",
        });
      }

      const isPdf = fileType === "application/pdf";
       const isImage = fileType?.startsWith("image/");

      // Store images as image assets and documents as raw assets.
      // Raw assets avoid applying image transformations to documents.
      const resourceType = isImage ? "image" : "raw";

      // Cloudinary detects the uploaded resource type.
      const uploadResponse = await cloudinary.uploader.upload(
        fileData,
        {
          resource_type: resourceType,
          folder: "chat_attachments",
          ...(fileName ? { filename_override: fileName } : {}),
        }
      );

      if (isImage) {
        imageUrl = uploadResponse.secure_url;
      } else {
        fileUrl = uploadResponse.secure_url;
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text?.trim() || "",
      image: imageUrl,
      fileUrl,
      fileName: fileName || "",
      fileType: fileType || "",
      fileSize: Number(fileSize) || 0,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);

    return res.status(500).json({
      message: "Failed to send message",
    });
  }
};

export const deleteForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findByIdAndUpdate(
      id,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message hidden successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteForEveryone = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByIdAndUpdate(
      id,
      { $set: { deletedForEveryone: true } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({ message: "Message hidden for everyone" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};