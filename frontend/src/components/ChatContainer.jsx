import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore';

import ChatHeader from "./skeletons/ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from '../store/useAuthStore';

import { formatMessageTime } from '../lib/utils';

import { MoreVertical, FileText, Download,File as FileIconTrash2 } from "lucide-react";

const getDateLabel = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (date1, date2) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  if (isSameDay(messageDate, today)) return "Today";
  if (isSameDay(messageDate, yesterday)) return "Yesterday";

  return messageDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages,
    unsubscribeFromMessages, deleteForEveryone, deleteForMe
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [messages, selectedUser?._id, isMessagesLoading]);

  if (isMessagesLoading) {
    return (
      <div className='flex-1 flex flex-col overflow-auto'>
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />

      <div className='flex-1 overflow-auto p-4 space-y-4'>
        
        {messages.map((message, index) => {
          const currentDate = new Date(message.createdAt).toDateString();

          const previousDate =
            index > 0
              ? new Date(messages[index - 1].createdAt).toDateString()
              : null;

          const showDate = currentDate !== previousDate;

          return (
            <React.Fragment key={message._id}>
              {/* Date separator */}
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-base-300 text-base-content text-xs px-3 py-1 rounded-lg shadow-sm">
                    {getDateLabel(message.createdAt)}
                  </span>
                </div>
              )}

              {/* Existing message */}
              <div
                className={`chat ${
                  message.senderId === authUser._id
                    ? "chat-end"
                    : "chat-start"
                }`}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        message.senderId === authUser._id
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>

                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>

                <div className="relative group">
                  <div className="chat-bubble flex flex-col">
                    {message.deletedForEveryone ? (
                      <span className="italic text-gray-400">
                        This message was deleted
                      </span>
                    ) : (
                      
                      <>
                        {/* Image attachment */}
                        {message.image && (
                          <a
                            href={message.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-2"
                          >
                            <img
                              src={message.image}
                              alt="Image attachment"
                              className="max-w-[350px] max-h-[350px] w-auto h-auto object-contain rounded-lg"
                            />
                          </a>
                        )}

                        {/* General file attachment */}
                        
{/* General file attachment */}
{message.fileUrl && (
  message.fileType?.startsWith("image/") && !message.image ? (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2"
    >
      <img
        src={message.fileUrl}
        alt={message.fileName || "Image attachment"}
        className="max-w-[350px] max-h-[350px] w-auto h-auto object-contain rounded-lg"
      />
    </a>
  ) : (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-base-200 hover:opacity-80 max-w-[300px]"
    >
      <FileText size={28} className="shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {message.fileName || "Download attachment"}
        </p>

        <p className="text-xs opacity-60">
          {message.fileType || "File"}
          {message.fileSize
            ? ` • ${(message.fileSize / 1024).toFixed(1)} KB`
            : ""}
        </p>
      </div>

      <Download size={18} className="shrink-0" />
    </a>
  )
)}


                        {/* Text message */}
                        {message.text && <span>{message.text}</span>}
                      </>

                    )}
                  </div>

                  <div
                    className={`absolute top-0 opacity-0 group-hover:opacity-100 transition ${
                      message.senderId === authUser._id
                        ? "-left-10"
                        : "-right-10"
                    }`}
                  >
                    <div
                      className={`dropdown ${
                        message.senderId === authUser._id
                          ? "dropdown-end"
                          : "dropdown-right"
                      }`}
                    >
                      <button tabIndex={0} className="btn btn-xs btn-ghost">
                        <MoreVertical size={16} />
                      </button>

                      <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box shadow w-48"
                      >
                        <li>
                          <button onClick={() => deleteForMe(message._id)}>
                            Delete for Me
                          </button>
                        </li>

                        {message.senderId === authUser._id && (
                          <li>
                            <button
                              onClick={() => deleteForEveryone(message._id)}
                            >
                              Delete for Everyone
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  )
}

export default ChatContainer;
