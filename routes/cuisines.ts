import express from "express";
import { initializeRedisClient } from "../utils/client.js";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
	try {
		const client = await initializeRedisClient();
		const cuisines = await client.sMembers(cuisinesKey);
		return successResponse(res, cuisines);
	} catch (error) {
		next(error);
	}
});

router.get("/:cuisine", async (req, res, next) => {
	try {
		const { cuisine } = req.params;
		const client = await initializeRedisClient();
		const restaurantIds = await client.sMembers(cuisineKey(cuisine));
		console.log({ restaurantIds });
		const restaurants = await Promise.all(
			restaurantIds.map((id) => client.hGet(restaurantKeyById(id), "name")),
		);
		return successResponse(res, restaurants);
	} catch (error) {
		next(error);
	}
});

export default router;
