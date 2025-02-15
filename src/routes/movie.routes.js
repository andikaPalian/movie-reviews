import express from 'express';
import { adminValidation, hashRole } from '../middlewares/adminValidation.js';
import { addMovies } from '../controllers/movie.controllers.js';
import upload from '../middlewares/multer.js';

const movieRouter = express.Router();

movieRouter.post("/add", adminValidation, hashRole(["super_admin", "movie_admin"]), upload.single("poster"), addMovies);

export default movieRouter;