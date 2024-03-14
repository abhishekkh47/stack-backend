import winston from "winston";
import CloudWatchTransport from "winston-aws-cloudwatch";

export const logger = winston.createLogger({
  level: "info", // Set log level
  format: winston.format.json(), // JSON format for log messages
  transports: [
    // Add CloudWatch transport
    new CloudWatchTransport({
      logGroupName: process.env.MJ_AWS_LOG_GROUP,
      logStreamName: process.env.MJ_AWS_LOG_STREAM,
      awsConfig: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: "us-west-2",
      },
      formatLog: (info) => `${info.level}: ${info.message}`,
    }),
  ],
});
