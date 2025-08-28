import { create } from "zustand";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set) => ({
    user: null,
    loading: false,
    checkingAuth: true,

    signup: async ({ name, email, password, confirmPassword }) => {
        set({ loading: true });

        if (password !== confirmPassword) {
            set({ loading: false });
            return toast.error("Passwords do not match");
        }

        try {
            const res = await axiosInstance.post("/auth/signup", {
                name,
                email,
                password
            });

            set({ user: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    login: async (email, password) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.post("/auth/login", {
                email,
                password
            })

            set({ user: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    checkAuth: async () => {
        set({ checkingAuth: true });

        try {
            const res = await axiosInstance.get("/auth/profile");

            set({ user: res.data, checkingAuth: false });
        } catch (error) {
            set({ checkingAuth: false, user: null });
            toast.error(error.response.data.message || "An error occurred");
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ user: null })
        } catch (error) {
            toast.error(error.response.data.message || "An error occurred");
        }
    }
}));

// TODO: Implement the axios interceptors for refreshing access token 15m