import express from "express";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema } from "../schemas/restaurant.js";
import {
	addRestaurant,
	addReview,
	deleteReviewById,
	getRestaurantById,
	getReviews,
} from "../controllers/restaurants.controller.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";
import { ReviewSchema } from "../schemas/review.js";

const router = express.Router();

router.post("/", validate(RestaurantSchema), addRestaurant);

router.get("/:restaurantId", checkRestaurantExists, getRestaurantById);

router.post("/:restaurantId/reviews", checkRestaurantExists, validate(ReviewSchema), addReview);

router.get("/:restaurantId/reviews", checkRestaurantExists, getReviews);

router.delete("/:restaurantId/reviews/:reviewId", checkRestaurantExists, deleteReviewById);

export default router;
