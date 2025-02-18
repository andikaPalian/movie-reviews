import express from 'express';
import { addReview, editReview } from '../controllers/reviews.controllers.js';
import auth from '../middlewares/authMiddlewares.js';

const reviewsRouter = express.Router();

// User routes
reviewsRouter.post("/:movieId",auth, addReview);
reviewsRouter.patch("/:movieId/:reviewId/edit", auth, editReview);

export default reviewsRouter;