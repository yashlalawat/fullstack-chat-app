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

export const sendMessage = async (req , res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
            //upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        //check user is uploading image

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });
        //create message

        await newMessage.save();
        //save it to the database

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ",error.message);
        res.status(500).json({ error: "Internal server error " });
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