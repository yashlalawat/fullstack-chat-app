import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore';

import ChatHeader from "./skeletons/ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from '../store/useAuthStore';

import { formatMessageTime } from '../lib/utils';

import { MoreVertical, Trash2 } from "lucide-react";

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
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className='chat-image avatar'>
              <div className='size-10 rounded-full border'>
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
            <div className='chat-header mb-1'>
              <time className='text-xs opacity-50 ml-1'>
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
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[200px] rounded-lg mb-2"
                      />
                    )}

                    {message.text && (
                      <span>{message.text}</span>
                    )}
                  </>
                )}
              </div>

              <div 
                className={`absolute top-0 opacity-0 group-hover:opacity-100 transition
                  ${
                    message.senderId === authUser._id
                      ? "-left-10"      // Sent messages → button on left
                      : "-right-10"     // Received messages → button on right
                  }`}
              >
                <div className={`dropdown ${
                    message.senderId === authUser._id
                      ? "dropdown-end"
                      : "dropdown-right"
                  }`}>
                  <button tabIndex={0} className="btn btn-xs btn-ghost">
                    <MoreVertical size={16} />
                  </button>

                  <ul
                    tabIndex={0}
                    className="dropdown-content menu bg-base-100 rounded-box shadow w-48"
                  >
                    {/* Everyone can delete for themselves */}
                    <li>
                      <button onClick={() => deleteForMe(message._id)}>
                        Delete for Me
                      </button>
                    </li>

                    {/* Only sender can delete for everyone */}
                    {message.senderId === authUser._id && (
                      <li>
                        <button onClick={() => deleteForEveryone(message._id)}>
                          Delete for Everyone
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  )
}

export default ChatContainer;
