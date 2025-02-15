import Admin from "../models/admin.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const registerAdmin = async (req, res) => {
    try {
        const {name, email, password} = req.body;
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "Please fill all the required fields"
            });
        }

        if (typeof name !== "string" || !validator.isLength(name, {min: 3, max: 30})) {
            return res.status(400).json({
                message: "Name must be a string and between 3 and 30 characters"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }

        const existingAdmin = await Admin.findOne({
            email: email.toLowerCase().trim()
        });
        if (existingAdmin) {
            return res.status(400).json({
                message: "Admin already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = new Admin({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });
        await admin.save();

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(201).json({
            message: "Admin registered successfully",
            admin: {
                name: adminResponse.name,
                email: adminResponse.email,
                role: adminResponse.admin_role
            }
        });
    } catch (error) {
        console.error("Error during registering admin:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const loginAdmin = async (req, res) => {
    try {
        const {email, password} = req.body;
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({
                message: "Please fill all the required fields"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        const admin = await Admin.findOne({
            email: email.toLowerCase().trim()
        });
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
            const token = jwt.sign({
                id: admin._id
            }, process.env.JWT_SECRET, {expiresIn: "1d"});
            admin.password = undefined;

            return res.status(200).json({
                message: "Admin logged in successfully",
                admin: {
                    name: admin.name,
                    email: admin.email,
                    role: admin.admin_role,
                    token: token
                }
            });
        } else {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {registerAdmin, loginAdmin};