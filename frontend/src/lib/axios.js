import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api",
    withCredentials: true, // send cookies to the server
});

// console.log(import.meta.env.MODE)

export default axiosInstance;