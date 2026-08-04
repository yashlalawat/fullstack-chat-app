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
                { senderId: myId , receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId},
            ],
            deletedFor: {
                $ne: req.user._id,
            },

            deletedForEveryone: false,
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

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    await Message.findByIdAndUpdate(id, {
      $addToSet: {
        deletedFor: req.user._id,
      },
    });

    const mySocketId = getReceiverSocketId(req.user._id.toString());

    if (mySocketId) {
      io.to(mySocketId).emit("messageDeletedForMe", {
        messageId: id,
      });
    }

    res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteForEveryone = async (req, res) => {
  try {

    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        error: "Message not found",
      });
    }

    // Only sender can delete for everyone
    if (
      message.senderId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        error: "Unauthorized",
      });
    }

    message.deletedForEveryone = true;

    await message.save();

    const senderSocket = getReceiverSocketId(
      message.senderId.toString()
    );

    const receiverSocket = getReceiverSocketId(
      message.receiverId.toString()
    );

    if (senderSocket) {
      io.to(senderSocket).emit("messageDeletedForEveryone", {
        messageId: id,
      });
    }

    if (receiverSocket) {
      io.to(receiverSocket).emit("messageDeletedForEveryone", {
        messageId: id,
      });
    }

    res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
};