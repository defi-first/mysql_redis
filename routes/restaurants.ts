import express from "express";
import { validate } from "../middlewares/validate.js";
import { type Restaurant, RestaurantSchema } from "../schemas/restaurant.js";

const router = express.Router();

router.post("/", validate(RestaurantSchema), async (req, res) => {
	const data = req.body as Restaurant;
	res.send("hello world");
});

export default router;
