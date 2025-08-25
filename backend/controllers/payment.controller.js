import { stripe } from "../lib/stripe.js"

import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";

export const createCheckoutSession = async (req, res) => {
    const user = req.user;

    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Invalid or empty products array" });
        }

        let totalAmount = 0;

        const lineItems = products.map((product) => {
            // stripe expects amount in cents
            // Example: $10.00 * 100 -> 1000
            const amount = Math.round(product.price * 100);
            totalAmount += product.price * product.quantity;

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: amount,
                }
            }
        })

        let coupon = null;

        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: user._id, isActive: true });

            if (coupon) {
                totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100)
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon ? [
                { coupon: await createStripeCoupon(coupon.discountPercentage) }
            ] : [],
            metadata: {
                userId: user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price
                    }))
                )
            }
        })

        if (totalAmount >= 20000) {
            await createNewCoupon(user._id)
        }

        res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 })

    } catch (error) {
        console.log("Error in createCheckoutSession controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        if (session.payment_status === "paid") {
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate({
                    code: session.metadata.couponCode,
                    userId: session.metadata.userId
                }, {
                    isActive: false
                })
            }

            // create a new order
            const products = JSON.parse(session.metadata.products)
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map((product) => ({
                    product: product._id,
                    quantity: product.quantity,
                    price: product.price
                })),
                totalAmount: session.amount_total / 100, // Convert from cents to dollars
                stripeSessionId: sessionId
            })

            await newOrder.save()

            res.status(200).json({
                success: true,
                message: "Payment successful, order created, and coupon deactivated if used.",
                orderId: newOrder._id
            })
        }
    } catch (error) {
        console.error("Error processing successful checkout:", error)
        res.status(500).json({ message: "Error processing successful checkout", error: error.message })
    }
}

async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupon.create({
        percent_off: discountPercentage,
        duration: "once",
    })

    return coupon.id
}

async function createNewCoupon(userId) {
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString().substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        userId: userId
    })

    await newCoupon.save()

    return newCoupon
}

