import Movie from "../models/movies.models.js";
import Reviews from "../models/reviews.models.js";
import User from "../models/user.models.js";
import Admin from "../models/admin.models.js";
import validator from "validator";
import fs from "fs/promises";
import { v2 as cloudinary } from 'cloudinary';

const addMovies = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const { title, description, genre, director, cast, release_year, rating, poster } = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        if (!title?.trim() || !description?.trim() || !genre?.trim() || !director?.trim() || !cast?.trim() || !release_year?.trim() || !rating?.trim() || !poster?.trim()) {
            return res.status(400).json({
                message: "Please fill all the required fields"
            });
        }

        if (typeof title !== "string" || !validator.isLength(title, {min: 1, max: 100})) {
            return res.status(400).json({
                message: "Title must be a string and between 1 and 100 characters"
            });
        }

        if (typeof description !== "string" || !validator.isLength(description, {min: 1, max: 500})) {
            return res.status(400).json({
                message: "Description must be a string and between 1 and 500 characters"
            });
        }

        const validGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Thriller", "Sci-Fi"];
        if (!validGenres.includes(genre)) {
            return res.status(400).json({
                message: "Invalid genre. Genre must be one of the following: Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Romance, Thriller, Sci-Fi"
            });
        }

        if (typeof director !== "string" || !validator.isLength(director, {min: 1, max: 100})) {
            return res.status(400).json({
                message: "Director must be a string and between 1 and 100 characters"
            });
        }

        if (!Array.isArray(cast) || cast.length === 0) {
            return res.status(400).json({
                message: "Cast must be an array and must contain at least one actor"
            });
        }

        if (!cast.every(actor => typeof actor === "string" && actor.trim() !== "")) {
            return res.status(400).json({
                message: "Every actor in the cast must be a string and must not be empty"
            });
        }

        if (typeof release_year !== "number" || !validator.isInt(release_year.toString(), {min: 1900, max: new Date().getFullYear()})) {
            return res.status(400).json({
                message: "Release year must be a number and must be between 1900 and the current year"
            });
        }

        if (typeof rating !== "number" || !validator.isFloat(rating.toString(), {min: 0, max: 10})) {
            return res.status(400).json({
                message: "Rating must be a number and must be between 0 and 10"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            use_filename: true,
            unique_filename: true,
        });

        await fs.unlink(req.file.path);

        const movie = new Movie({
            title: title.trim(),
            description: description.trim(),
            genre: genre.trim(),
            director: director.trim(),
            cast,
            release_year,
            rating,
            poster: result.secure_url,
            cloudinary_id: result.public_id,
        });
        await movie.save();

        res.status(201).json({
            message: "Movie added successfully",
            movie: {
                id: movie._id,
                title: movie.title,
                description: movie.description,
                genre: movie.genre,
                director: movie.director,
                cast: movie.cast,
                release_year: movie.release_year,
                rating: movie.rating,
                poster: movie.poster,
                reviews: movie.reviews,
                cloudinary_id: movie.cloudinary_id
            }
        });
    } catch (error) {
        console.error("Error during add movies:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {addMovies};