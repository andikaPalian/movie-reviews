import Movie from "../models/movies.models.js";
import Admin from "../models/admin.models.js";
import validator from "validator";
import fs from "fs/promises";
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";

const addMovies = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const { title, description, genre, director, cast, release_year, rating} = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        if (!title?.trim() || !description?.trim() || !genre?.trim() || !director?.trim() || !cast?.trim() || !release_year?.trim() || !rating?.trim()) {
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
        if (Array.isArray(genre)) {
            if (!genre.every(genre => validGenres.includes(genre))) {
                return res.status(400).json({
                    message: `Invalid genre. Allowed genre are ${validGenres.join(", ")}`
                });
            }
        } else {
            if (!validGenres.includes(genre)) {
                return res.status(400).json({
                    message: `Invalid genre. Allowed genre are ${validGenres.join(", ")}`
                });
            }
        }

        if (typeof director !== "string" || !validator.isLength(director, {min: 1, max: 100})) {
            return res.status(400).json({
                message: "Director must be a string and between 1 and 100 characters"
            });
        }

        let parsedCast;
        try {
            // Jika cast berupa string, lakukan parsing
            if (typeof cast === "string") {
                parsedCast = JSON.parse(cast);
            } else if (Array.isArray(cast)) {
                // Jika cast berupa array, langsung gunakan
                parsedCast = cast;
            } else {
                // Jika cast bukan string atau array, kembalikan error
                return res.status(400).json({
                    message: "Invalid cast format",
                    error: "cast must be a string or an array of strings"
                });
            }
        } catch (error) {
            console.error("Error parsing cast:", error);
            return res.status(500).json({
                message: "Internal server error",
                error: "Failed to parse cast"
            });
        }

        if (!validator.isInt(release_year.toString(), { min: 1900, max: new Date().getFullYear() })) {
            return res.status(400).json({
                message: "Release year must be a number and between 1900 and the current year"
            });
        }
        

        if (!validator.isFloat(rating.toString(), { min: 0, max: 10 })) {
            return res.status(400).json({
                message: "Rating must be a float number and between 0 and 10"
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

const editMovies = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {movieId} = req.params;
        const updateData = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(400).json({
                message: "Invalid movie ID"
            });
        }

        const allowedFields = ["title", "description", "genre", "director", "cast", "release_year", "rating"];
        const data = {};
        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                data[key] = value;
            } else if (key === "cast" && Array.isArray(value)) {
                data[key] = value;
            } else if (key === "poster") {
                data.poster = value;
            } else {
                return res.status(400).json({
                    message: "Invalid update fields",
                    error: `Only the following fields are allowed to be updated: ${allowedFields.join(", ")}`
                });
            }
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                message: "Movie not found"
            });
        }

        if (req.file) {
            if (movie.cloudinary_id) {
                await cloudinary.uploader.destroy(movie.cloudinary_id);
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                use_filename: true,
                unique_filename: true,
            });

            await fs.unlink(req.file.path);

            data.poster = result.secure_url;
            data.cloudinary_id = result.public_id;
        }

        const updateMovie = await Movie.findByIdAndUpdate(
            movieId,
            {
                $set: data
            },
            {
                new: true
            }
        );
        if (!updateMovie) {
            return res.status(404).json({
                message: "Movie not found or already deleted"
            });
        }

        res.status(200).json({
            message: "Movie updated successfully",
            movie: {
                id: updateMovie._id,
                title: updateMovie.title,
                description: updateMovie.description,
                genre: updateMovie.genre,
                director: updateMovie.director,
                cast: updateMovie.cast,
                release_year: updateMovie.release_year,
                rating: updateMovie.rating,
                poster: updateMovie.poster,
                reviews: updateMovie.reviews,
                cloudinary_id: updateMovie.cloudinary_id
            }
        });
    } catch (error) {
        console.error("Error during edit movies:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const deleteMovies = async (req, res) => {
    try {
        const adminId = req.admin.adminId;
        const {movieId} = req.params;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
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

        if (movie.cloudinary_id) {
            await cloudinary.uploader.destroy(movie.cloudinary_id);
        }

        await Movie.findByIdAndDelete(movieId);

        res.status(200).json({
            message: "Movie deleted successfully"
        });
    } catch (error) {
        console.error("Error during delete movies:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

const listMovies = async (req, res) => {
    try {
        const {search, genre, page = 1, limit = 10} = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;
        const query = {};

        const validGenres = [
            "Action",
            "Adventure",
            "Comedy",
            "Drama",
            "Fantasy",
            "Horror",
            "Mystery",
            "Romance",
            "Sci-Fi",
            "Thriller",
            "Western"
        ];

        if (search) {
            query.$or = [
                {
                    title: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    genre: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    director: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    cast: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        if (genre && validGenres.includes(genre)) {
            query.genre = genre;
        }

        const movies = await Movie.find(query).skip(skip).limit(limitNum);
        if (!movies || movies.length === 0) {
            return res.status(404).json({
                message: "No movies found"
            });
        }
        const totalMovies = await Movie.countDocuments(query);

        res.status(200).json({
            message: "Movies retrieved successfully",
            movies: {
                totalMovies: totalMovies,
                totalPages: Math.ceil(totalMovies / limitNum),
                currentPage: pageNum,
                movies: movies.map(movie => ({
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
                }))
            }
        });
    } catch (error) {
        console.log("Error during getting movies list:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred"
        });
    }
}

export {addMovies, editMovies, deleteMovies, listMovies};