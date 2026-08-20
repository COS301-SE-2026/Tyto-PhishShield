import winston from 'winston';
import 'winston-daily-rotate-file';
const { combine, timestamp, json, errors } = winston.format;
const logDir = process.env.LOG_DIR ?? '/var/log/api-gateway';

const isTestOrCi =
  process.env.NODE_ENV === 'test' ||
  process.env.CI === 'true' ||
  process.env.LOG_TO_FILE === 'false';

const normalTransports: winston.transport[] = [
  new winston.transports.Console(),
];

const exceptionTransports: winston.transport[] = [
  new winston.transports.Console(),
];

const rejectionTransports: winston.transport[] = [
  new winston.transports.Console(),
];

if (!isTestOrCi) {
  normalTransports.push(
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: 'standard-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  );
  exceptionTransports.push(
    new winston.transports.DailyRotateFile({
          dirname: logDir,
          filename: 'exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
        }),
  );
  rejectionTransports.push(
    new winston.transports.DailyRotateFile({
          dirname: logDir,
          filename: 'rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
        }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || undefined,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: normalTransports,
  exceptionHandlers: exceptionTransports,
  rejectionHandlers: rejectionTransports,
});
