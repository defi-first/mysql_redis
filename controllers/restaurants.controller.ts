import type { NextFunction, Request, Response } from "express";
import type { Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import { restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

export const addRestaurant = async (req: Request, res: Response, next: NextFunction) => {
	const data = req.body as Restaurant;

	try {
		const client = await initializeRedisClient();
		const id = nanoid();
		const restaurantKey = restaurantKeyById(id);
		const hashData = { id, name: data.name, location: data.location };
		const addResult = await client.hSet(restaurantKey, hashData);
		return successResponse(res, hashData, "Add new restaurant");
	} catch (error) {
		next(error);
	}
};

export const getRestaurantById = async (req: Request, res: Response, next: NextFunction) => {
	const restaurantId = req.params.restaurantId as string;

	try {
		const client = await initializeRedisClient();
		const restaurantKey = restaurantKeyById(restaurantId);
		const [viewCount, restaurant] = await Promise.all([
			client.hIncrBy(restaurantKey, "viewCount", 1),
			client.hGetAll(restaurantKey),
		]);
		return successResponse(res, restaurant);
	} catch (error) {
		next(error);
	}
};
