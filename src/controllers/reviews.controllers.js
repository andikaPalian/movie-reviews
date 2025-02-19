import Reviews from "../models/reviews.models.js";
import Movie from "../models/movies.models.js";
import User from "../models/user.models.js";
import validator from "validator";
import mongoose from "mongoose";

const addReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {movieId} = req.params;
        const {rating, comment} = req.body;

        const user = await User.findById(userId).populate("name");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                message: "Invalid movie ID"
            });
        }

        const movie = await Movie.findById(movieId).populate("title");
        if (!movie) {
            return res.status(404).json({
                message: "Movie not found"
            });
        }

        if (!validator.isInt(rating.toString(), {min: 1, max: 5})) {
            return res.status(400).json({
                message: "Invalid rating value. Rating must be an integer between 1 and 5"
            });
        }

        if (typeof comment !== "string" || !validator.isLength(comment, {min: 1, max: 1000})) {
            return res.status(400).json({
                message: "Comment must be a string and between 1 and 1000 characters"
            });
        }

        const exitingReview = await Reviews.findOne({
            user: userId, 
            movie: movieId
        });
        if (exitingReview) {
            return res.status(400).json({
                message: "You have already reviewed this movie"
            });
        }

        const review = new Reviews({
            user: userId,
            movie: movieId,
            rating,
            comment            
        });
        await review.save();

        await movie.updateOne({
            $push: {
                reviews: review._id
            }
        });

        await movie.save();

        res.status(201).json({
            message: "Review added successfully",
            review: {
                id: review._id,
                user: {
                    name: user.name,
                    id: user._id
                },
                movie: {
                    title: movie.title,
                    id: movie._id
                },
                rating: review.rating,
                comment: review.comment
            }
        });
    } catch (error) {
        console.error("Error during add review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const editReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {movieId, reviewId} = req.params;
        const {rating, comment} = req.body;

        const user = await User.findById(userId).populate("name");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                message: "Invalid movie ID"
            });
        }

        const movie = await Movie.findById(movieId).populate("title");
        if (!movie) {
            return res.status(404).json({
                message: "Movie not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const review = await Reviews.findOne({
            _id: reviewId,
            user: userId,
            movie: movieId
        });
        if (!review) {
            return res.status(404).json({
                message: "Review not found"
            });
        }

        if (review.user.toString() !== String(userId)) {
            return res.status(403).json({
                message: "You are not authorized to edit this review"
            });
        }

        const updateData = {};
        if (rating !== undefined) {
            if (!validator.isInt(rating.toString(), { min: 1, max: 5 })) {
                return res.status(400).json({
                    message: "Invalid rating value. Rating must be an integer between 1 and 5"
                });
            }
            updateData.rating = rating;
        }
        if (comment !== undefined) {
            if (typeof comment !== "string" || !validator.isLength(comment, { min: 1, max: 1000 })) {
                return res.status(400).json({
                    message: "Comment must be a string and between 1 and 1000 characters"
                });
            }
            updateData.comment = comment;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No fields provided for update"
            });
        }

        await Reviews.updateOne({
            _id: reviewId,
            user: userId,
            movie: movieId
        }, {
            $set: updateData
        });

        res.status(200).json({
            message: "Review updated successfully",
            review: {
                id: review._id,
                user: {
                    name: user.name,
                    id: user._id
                },
                movie: {
                    title: movie.title,
                    id: movie._id
                },
                rating: updateData.rating || review.rating,
                comment: updateData.comment || review.comment
            }
        });
    } catch (error) {
        console.error("Error during edit review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const deleteReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {movieId, reviewId} = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                message: "Invalid movie ID"
            });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                message: "Movie not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const review = await Reviews.findOne({
            _id: reviewId,
            user: userId,
            movie: movieId
        });
        if (!review) {
            return res.status(404).json({
                message: "Review not found"
            });
        }

        if (review.user.toString() !== String(userId)) {
            return res.status(403).json({
                message: "You are not authorized to delete this review"
            });
        }

        await Reviews.findByIdAndDelete(reviewId);

        await Movie.updateOne({
            _id: movieId
        }, {
            $pull: {
                reviews: reviewId
            }
        });

        res.status(200).json({
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete review:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {addReview, editReview, deleteReview};