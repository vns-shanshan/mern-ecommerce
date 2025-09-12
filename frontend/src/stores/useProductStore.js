import { create } from "zustand";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";

export const useProductStore = create((set) => ({
    products: [],
    loading: false,

    setProducts: (products) => set({ products }),

    createProduct: async (productData) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.post("/products", productData);
            set((prevState) => ({
                products: [...prevState.products, res.data],
                loading: false
            }))
        } catch (error) {
            toast.error(error.response.data.message);
            set({ loading: false });
        }
    },

    fetchAllProducts: async () => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get("/products");
            set({ products: res.data.products, loading: false });
        } catch (error) {
            set({ error: "Failed to fetch products", loading: false });
            toast.error(error.response.data.message || "Failed to fetch products");
        }
    },

    deleteProduct: async (productId) => {
        set({ loading: true });

        try {
            await axiosInstance.delete(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.filter((product) => product._id !== productId),
                loading: false
            }))
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message);
        }
    },

    toggleFeaturedProduct: async (productId) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.patch(`/products/${productId}`);
            // this will update the isFeatured prop of the product
            set((prevProducts) => ({
                products: prevProducts.products.map((product) => product._id === productId ? { ...product, isFeatured: res.data.isFeatured } : product),
                loading: false
            }))
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message);
        }
    },

    fetchProductsByCategory: async (category) => {
        set({ loading: true });

        try {
            const res = await axiosInstance.get(`/products/category/${category}`);
            set({ products: res.data.products, loading: false });
        } catch (error) {
            set({ error: "Failed to fetch products", loading: false });
            toast.error(error.response.data.message || "Failed to fetch products");
        }
    },

    fetchFeaturedProducts: async () => {
        try {
            const res = await axiosInstance.get("/products/featured");
            set({ products: res.data, loading: false });
        } catch (error) {
            set({ error: "Failed to fetch featured products", loading: false });
            console.log("Error in fetchFeaturedProducts:", error);
        }
    }
}))