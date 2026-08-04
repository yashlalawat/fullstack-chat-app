import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessageLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessageLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isMessageLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            set({
                messages: [...get().messages, newMessage],
            });
        });

        socket.on("messageDeletedForMe", ({ messageId }) => {
            set((state) => ({
                messages: state.messages.filter(
                    (m) => m._id !== messageId
                ),
            }));
        });

        socket.on("messageDeletedForEveryone", ({ messageId }) => {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m._id === messageId
                        ? {
                            ...m,
                            deletedForEveryone: true,
                        }
                        : m
                ),
            }));
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("messageDeletedForMe");
        socket.off("messageDeletedForEveryone");
    },

    //todo : optimize this one later
    setSelectedUser: (selectedUser) => set({ selectedUser }),

    deleteForEveryone: async (messageId) => {
        try {
            await axiosInstance.patch(`/messages/delete-for-everyone/${messageId}`);

            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, deletedForEveryone: true }
                        : msg
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete message");
        }
    },

    deleteForMe: async (messageId) => {
        try {
            await axiosInstance.patch(`/messages/delete-for-me/${messageId}`);

            set((state) => ({
                messages: state.messages.filter(
                    (msg) => msg._id !== messageId
                ),
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete message");
        }
    },

}));