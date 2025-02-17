import express from 'express';
import cors from 'cors';
import multer from 'multer';
import 'dotenv/config';
import connectDB from './src/config/db.js';
import userRouter from './src/routes/user.routes.js';
import adminRouter from './src/routes/admin.routes.js';
import connectCloudinary from './src/config/cloudinary.js';
import movieRouter from './src/routes/movie.routes.js';
import reviewsRouter from './src/routes/reviews.routes.js';

const app = express();
const port = process.env.PORT;
connectDB();
connectCloudinary();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/movies", movieRouter);
app.use("/api/reviews", reviewsRouter);

// Handle multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    } else if (err) {
        console.error("Unexpected error:", err)
        return res.status(500).json({ message: err.message || "Internal server error" });
    }
    next();
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});