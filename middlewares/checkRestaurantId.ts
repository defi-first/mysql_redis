import type { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/responses.js";
import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";

export const checkRestaurantExists = async (req: Request, res: Response, next: NextFunction) => {
	const { restaurantId } = req.params;

	if (typeof restaurantId === "string") {
		const client = await initializeRedisClient();
		const restaurantKey = restaurantKeyById(restaurantId);
		const exists = await client.exists(restaurantKey);
		if (!exists) {
			return errorResponse(res, 404, "Restaurant not found");
		}
	} else {
		return errorResponse(res, 400, "Restaurant Id not found");
	}

	next();
};
