import express from "express";
import { validate } from "../middlewares/validate.js";
import { RestaurantDetailsSchema, RestaurantSchema } from "../schemas/restaurant.js";
import {
	addRestaurant,
	addRestaurantDetail,
	addReview,
	deleteReviewById,
	getRestaurantById,
	getRestaurantDetail,
	getRestaurants,
	getReviews,
	getSearch,
	getWeather,
} from "../controllers/restaurants.controller.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";
import { ReviewSchema } from "../schemas/review.js";

const router = express.Router();

router.get("/", getRestaurants);

router.post("/", validate(RestaurantSchema), addRestaurant);

router.get("/", checkRestaurantExists, getWeather);

router.get("/:restaurantId", checkRestaurantExists, getRestaurantById);

router.post("/:restaurantId/reviews", checkRestaurantExists, validate(ReviewSchema), addReview);

router.post(
	"/:restaurantId/details",
	checkRestaurantExists,
	validate(RestaurantDetailsSchema),
	addRestaurantDetail,
);

router.get("/:restaurantId/details", checkRestaurantExists, getRestaurantDetail);

router.get("/:restaurantId/reviews", checkRestaurantExists, getReviews);

router.delete("/:restaurantId/reviews/:reviewId", checkRestaurantExists, deleteReviewById);

router.get("/search", getSearch);

export default router;
