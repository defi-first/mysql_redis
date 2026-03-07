import express from "express";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema } from "../schemas/restaurant.js";
import { addRestaurant, getRestaurantById } from "../controllers/restaurants.controller.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";

const router = express.Router();

router.post("/", validate(RestaurantSchema), addRestaurant);

router.get("/:restaurantId", checkRestaurantExists, getRestaurantById);

export default router;
