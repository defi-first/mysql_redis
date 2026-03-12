import { initializeRedisClient } from "../utils/client.js";
import { getKeyName, indexKey } from "../utils/keys.js";
import { SchemaFieldTypes } from "redis";

async function createIndex() {
	const client = await initializeRedisClient();

	try {
		await client.ft.dropIndex(indexKey);
	} catch (error) {
		console.log("No existing index to delete");
	}

	await client.ft.create(
		indexKey,
		{
			id: {
				type: SchemaFieldTypes.TEXT,
				AS: "id",
			},
			name: {
				type: SchemaFieldTypes.TEXT,
				AS: "name",
			},
			avgStars: {
				type: SchemaFieldTypes.NUMERIC,
				AS: "avgStars",
				SORTABLE: true,
			},
		},
		{
			ON: "HASH",
			PREFIX: getKeyName("restaurants"),
		},
	);
}

await createIndex();

process.exit();
