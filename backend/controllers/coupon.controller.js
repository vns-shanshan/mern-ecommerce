import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
    const user = req.user;

    try {
        const coupon = await Coupon.findOne({ userId: user._id, isActive: true });
        res.json(coupon || null)
    } catch (error) {
        console.log("Error in getCoupon controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const validateCoupon = async (req, res) => {
    const user = req.user;

    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ code: code, userId: user._id, isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found or inactive" });
        }

        if (coupon.expirationDate < new Date()) {
            coupon.isActive = false;
            await coupon.save();
            return res.status(400).json({ message: "Coupon has expired" });
        }

        res.json({
            message: "Coupon is valid",
            code: coupon.code,
            discountPercentage: coupon.discountPercentage
        });
    } catch (error) {
        console.log("Error in validateCoupon controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });

    }
}