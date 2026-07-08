import winston from 'winston';
import 'winston-daily-rotate-file';
const { combine, timestamp, json, errors } = winston.format;
const logDir = process.env.LOG_DIR ?? '/var/log/api-gateway';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || undefined,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: 'standard-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
});
