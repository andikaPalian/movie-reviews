import express from 'express';
import { addReview } from '../controllers/reviews.controllers.js';
import auth from '../middlewares/authMiddlewares.js';

const reviewsRouter = express.Router();

// User routes
reviewsRouter.post("/:movieId",auth, addReview);

export default reviewsRouter;