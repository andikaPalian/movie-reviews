import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './src/config/db.js';
import userRouter from './src/routes/user.routes.js';
import adminRouter from './src/routes/admin.routes.js';

const app = express();
const port = process.env.PORT;
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});