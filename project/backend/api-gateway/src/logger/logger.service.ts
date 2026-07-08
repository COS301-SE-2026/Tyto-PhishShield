import winston from 'winston';
import 'winston-daily-rotate-file';
const { combine, timestamp, json, errors, colorize } = winston.format;


export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || undefined,
    format: combine(colorize({all: true}), timestamp(), errors({ stack: true }), json()),
    transports: [
        new winston.transports.Console(), 
        new winston.transports.DailyRotateFile({ 
            filename: 'standard-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'exceptions.log'})
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'rejections.log' })
    ],
});