import jwt from "jsonwebtoken";
import Admin from "../models/admin.models.js";

const adminValidation = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        message: "Admin is not authorized"
                    });
                }
                const admin = await Admin.findById(decoded.id);
                if (!admin) {
                    return res.status(401).json({
                        message: "Admin not found"
                    });
                }
                req.admin = {
                    adminId: admin._id,
                    name: admin.name,
                    email: admin.email,
                    admin_role: admin.admin_role
                };
                next();
            });
        } else {
            return res.status(403).json({
                message: "Token is missing or not provided"
            });
        }
    } catch (error) {
        console.error("Error during admin validation:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const hashRole = (admin_role) => {
    return (req, res, next) => {
        // Validasi apakah admin_role ada di req.admin
        if (!req.admin || !req.admin.admin_role) {
            return res.status(403).json({
                message: "Unauthorized access. Admin role is missing or invalid"
            });
        }

        if (!Array.isArray(admin_role)) {
            return res.status(500).json({
                message: "Internal server error. Admin role is not an array"
            });
        }

        // Validasi apakah admin_role sesuai dengan yang diizinkan
        if (!admin_role.includes(req.admin.admin_role)) {
            return res.status(403).json({
                message: "Unauthorized access. Admin role does not match the required role"
            });
        }

        // Lanjutkan ke middleware berikutnya
        next();
    }
}

export {adminValidation, hashRole};