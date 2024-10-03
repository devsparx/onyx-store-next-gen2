import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import type { DynamoDBStreamHandler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";

const GENERAL_AGGREGATES_TABLE_NAME = process.env.GENERAL_AGGREGATES_TABLE_NAME;

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "keep-aggregates",
});

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Receives events from Product and Review tables

export const handler: DynamoDBStreamHandler = async (event) => {
  if (!GENERAL_AGGREGATES_TABLE_NAME) {
    console.error("Table names are not defined.", {
      GENERAL_AGGREGATES_TABLE_NAME,
    });
    return;
  }

  for (const record of event.Records) {
    if (!record.eventSourceARN || !record.eventName) {
      continue;
    }

    const eventSourceTableName = record.eventSourceARN.split("/")[1];
    if (record.eventName === "INSERT" || record.eventName === "REMOVE") {
      const isInsert = record.eventName === "INSERT";
      const increment = isInsert ? 1 : -1;

      logger.info(
        `Received ${record.eventName} event from ${eventSourceTableName}`
      );

      if (eventSourceTableName.includes("Product")) {
        await updateCount(GENERAL_AGGREGATES_TABLE_NAME, "Product", increment);
      } else if (eventSourceTableName.includes("Review")) {
        await updateCount(GENERAL_AGGREGATES_TABLE_NAME, "Review", increment);
      }
    }
  }
};

const updateCount = async (
  tableName: string,
  entityType: string,
  increment: number
) => {
  const marshalledKey = marshall({ entityType });

  logger.info(
    `Updating count for ${entityType} in ${tableName} by ${increment} with key:`,
    marshalledKey
  );

  const params = {
    TableName: tableName,
    Key: marshall({ entityType }),
    UpdateExpression: "ADD #count :increment",
    ExpressionAttributeNames: {
      "#count": "count",
    },
    ExpressionAttributeValues: {
      ":increment": { N: increment.toString() },
    },
  };

  try {
    await dynamoDBClient.send(new UpdateItemCommand(params));
  } catch (error) {
    console.error(`Failed to update count in ${tableName}:`, error);
  }
};