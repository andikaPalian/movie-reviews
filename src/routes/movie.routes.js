import express from 'express';
import { adminValidation, hashRole } from '../middlewares/adminValidation.js';
import { addMovies, deleteMovies, editMovies, listMovies } from '../controllers/movie.controllers.js';
import upload from '../middlewares/multer.js';

const movieRouter = express.Router();

// Admin routes
movieRouter.post("/add", adminValidation, hashRole(["super_admin", "movie_admin"]), upload.single("poster"), addMovies);
movieRouter.patch("/edit/:movieId", adminValidation, hashRole(["super_admin", "movie_admin"]), upload.single("poster"), editMovies);
movieRouter.delete("/delete/:movieId", adminValidation, hashRole(["super_admin", "movie_admin"]), deleteMovies);

// Public routes
movieRouter.get("/", listMovies);

export default movieRouter;