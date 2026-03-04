import express from "express";
import restaurantsRouter from "./routes/restaurants.js";
import cuisinesRouter from "./routes/cuisines.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use("/restaurants", restaurantsRouter);
app.use("/cuisines", cuisinesRouter);

app
	.listen(PORT, () => {
		console.log(`Server started on port ${PORT}`);
	})
	.on("error", (err) => {
		throw new Error(err.message);
	});
