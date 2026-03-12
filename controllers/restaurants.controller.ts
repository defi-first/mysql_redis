import type { NextFunction, Request, Response } from "express";
import type { Restaurant } from "../schemas/restaurant.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import {
	cuisineKey,
	cuisinesKey,
	restaurantCuisinesKeyById,
	restaurantDetailsKeyById,
	restaurantKeyById,
	restaurantsByRatingKey,
	reviewDetailsKeyById,
	reviewKeyById,
	weatherKeyById,
} from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import type { Review } from "../schemas/review.js";

export const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { page = 1, limit = 10 } = req.query;
		const client = await initializeRedisClient();
		const start = (Number(page) - 1) * Number(limit);
		const end = start + Number(limit);
		const restaurantIds = await client.zRange(restaurantsByRatingKey, start, end, {
			REV: true,
		});
		const restaurants = await Promise.all(
			restaurantIds.map((id) => client.hGetAll(restaurantKeyById(id))),
		);
		return successResponse(res, restaurants);
	} catch (error) {
		next(error);
	}
};
export const addRestaurant = async (req: Request, res: Response, next: NextFunction) => {
	const data = req.body as Restaurant;

	try {
		const client = await initializeRedisClient();
		const id = nanoid();
		const restaurantKey = restaurantKeyById(id);
		const hashData = { id, name: data.name, location: data.location };
		await Promise.all([
			...data.cuisines.map((cuisine) =>
				Promise.all([
					client.sAdd(cuisinesKey, cuisine),
					client.sAdd(cuisineKey(cuisine), id),
					client.sAdd(restaurantCuisinesKeyById(id), cuisine),
				]),
			),
			client.hSet(restaurantKey, hashData),
			client.zAdd(restaurantsByRatingKey, {
				score: 0,
				value: id,
			}),
		]);
		return successResponse(res, hashData, "Add new restaurant");
	} catch (error) {
		next(error);
	}
};

export const getWeather = async (
	req: Request<{ restaurantId: string }>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { restaurantId } = req.params;
		const client = await initializeRedisClient();
		const weatherKey = weatherKeyById(restaurantId);
		const cachedWeather = await client.get(weatherKey);
		if (cachedWeather) {
			return successResponse(res, JSON.parse(cachedWeather));
		}
		const restaurantKey = restaurantKeyById(restaurantId);
		const coords = await client.hGet(restaurantKey, "location");
		if (!coords) {
			return errorResponse(res, 404, "Could not find location");
		}
		const [lng, lat] = coords.split(",");
		const apiResponse = await fetch("MOCKAPI");
		if (apiResponse.status === 200) {
			const json = await apiResponse.json();
			await client.set(weatherKey, JSON.stringify(json));
			return successResponse(res, json);
		}
		return errorResponse(res, 404, "Could not find location");
	} catch (error) {
		next(error);
	}
};

export const addRestaurantDetail = async (
	req: Request<{ restaurantId: string }>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { restaurantId } = req.params;
		const data = req.body as any;
		const client = await initializeRedisClient();
		const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);
		await client.json.set(restaurantDetailsKey, ".", data);
		return successResponse(res, {}, "Restaurant Details added successfully");
	} catch (error) {
		next(error);
	}
};

export const getRestaurantDetail = async (
	req: Request<{ restaurantId: string }>,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { restaurantId } = req.params;
		const data = req.body as any;
		const client = await initializeRedisClient();
		const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);
		const detail = await client.json.get(restaurantDetailsKey);
		return successResponse(res, detail);
	} catch (error) {
		next(error);
	}
};
export const getRestaurantById = async (req: Request, res: Response, next: NextFunction) => {
	const restaurantId = req.params.restaurantId as string;

	try {
		const client = await initializeRedisClient();
		const restaurantKey = restaurantKeyById(restaurantId);
		const [viewCount, restaurant, cuisines] = await Promise.all([
			client.hIncrBy(restaurantKey, "viewCount", 1),
			client.hGetAll(restaurantKey),
			client.sMembers(restaurantCuisinesKeyById(restaurantId)),
		]);
		return successResponse(res, { ...restaurant, cuisines });
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
		const restaurantKey = restaurantKeyById(restaurantId);
		const reviewData = {
			id: reviewId,
			...data,
			timestamp: Date.now(),
			restaurantId,
		};

		const [reviewCount, setResult, totalStars] = await Promise.all([
			client.lPush(reviewKey, reviewId),
			client.hSet(reviewDetailsKey, reviewData),
			client.hIncrByFloat(restaurantKey, "totalStars", data.rating),
		]);

		const averageRating = Number((totalStars / reviewCount).toFixed(1));
		await Promise.all([
			client.zAdd(restaurantsByRatingKey, {
				score: averageRating,
				value: restaurantId,
			}),
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
