import React, { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, Smile, X, Paperclip, FileText } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MessageInput = () => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be 10 MB or less");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setFilePreview("");

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setFilePreview(reader.result);
      };

      reader.onerror = () => {
        toast.error("Could not preview this image");
      };

      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() && !selectedFile) return;

    try {
      let fileData = "";

      if (selectedFile) {
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Could not read file"));

          reader.readAsDataURL(selectedFile);
        });
      }

      await sendMessage({
        text: text.trim(),
        fileData,
        fileName: selectedFile?.name || "",
        fileType: selectedFile?.type || "",
        fileSize: selectedFile?.size || 0,
      });

      setText("");
      removeFile();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      {selectedFile && (
        <div className="mb-3 flex items-center gap-3">
          {filePreview ? (
            <div className="relative">
              <img
                src={filePreview}
                alt="Attachment preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove attachment"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 max-w-xs p-3 rounded-lg bg-base-200">
              <FileText size={28} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs opacity-60">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove attachment"
                className="btn btn-ghost btn-xs"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative">
          <button
            type="button"
            className="btn btn-circle"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="Choose emoji"
          >
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip"
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              selectedFile ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a file"
          >
            <Paperclip size={20} />
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !selectedFile}
          aria-label="Send message"
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;