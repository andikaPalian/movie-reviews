import jwt from 'jsonwebtoken';
import User from '../models/user.models';

const auth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
            if (!token) {
                return res.status(401).json({
                    message: "User is not authorized or token is missing"
                });
            }

            const user = await User.findById(decoded.user?.id || decoded.id);
            if (!user) {
                return res.status(401).json({
                    message: "User not found"
                });
            }

            req.user = {
                userId: user._id,
                name: user.name,
                email: user.email
            };
            
            next();
        } else {
            return res.status(401).json({
                message: "Token is missing or not provided"
            });
        }
    } catch (error) {
        console.error("Error during authentication:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export default auth;