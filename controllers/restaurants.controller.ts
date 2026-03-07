import type { NextFunction, Request, Response } from "express";
import type { Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import { restaurantKeyById, reviewDetailsKeyById, reviewKeyById } from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import type { Review } from "../schemas/review.js";

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

export const addReview = async (
	req: Request<{ restaurantId: string }>,
	res: Response,
	next: NextFunction,
) => {
	const { restaurantId } = req.params;
	const data = req.body as Review;
	try {
		const client = await initializeRedisClient();
		const reviewId = nanoid();
		const reviewKey = reviewKeyById(restaurantId);
		const reviewDetailsKey = reviewDetailsKeyById(reviewId);

		const reviewData = {
			id: reviewId,
			...data,
			timestamp: Date.now(),
			restaurantId,
		};

		await Promise.all([
			client.lPush(reviewKey, reviewId),
			client.hSet(reviewDetailsKey, reviewData),
		]);

		return successResponse(res, reviewData, "Review added");
	} catch (error) {
		next(error);
	}
};

export const getReviews = async (
	req: Request<{ restaurantId: string }>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { restaurantId } = req.params;
		const { page = 1, limit = 10 } = req.query;
		const client = await initializeRedisClient();
		const start = (Number(page) - 1) * Number(limit);
		const end = start + Number(limit) - 1;

		const reviewKey = reviewKeyById(restaurantId); // redis类型是一个list

		const reviewIds = await client.lRange(reviewKey, start, end);

		const reviews = await Promise.all(
			reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id))),
		);

		return successResponse(res, reviews);
	} catch (error) {
		next(error);
	}
};

export const deleteReviewById = async (
	req: Request<{ restaurantId: string; reviewId: string }>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { restaurantId, reviewId } = req.params;
		const client = await initializeRedisClient();
		const reviewKey = reviewKeyById(restaurantId);
		const reviewDetailsKey = reviewDetailsKeyById(reviewId);

		const [removeResult, deleteResult] = await Promise.all([
			client.lRem(reviewKey, 0, reviewId),
			client.del(reviewDetailsKey),
		]);

		if (removeResult === 0 && deleteResult === 0) {
			return errorResponse(res, 404, "Review not found");
		}

		return successResponse(res, reviewId, "Review removed");
	} catch (error) {
		next(error);
	}
};
