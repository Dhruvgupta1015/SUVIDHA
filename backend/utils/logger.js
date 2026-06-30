import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for readable output
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

// Configure centralized Winston logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console output with colors
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    // All logs go to app.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/app.log'),
      maxsize: 5242880, // 5MB limit
      maxFiles: 5
    }),
    // Errors and Critical logs go to error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB limit
      maxFiles: 5
    })
  ]
});

// Helper for 'critical' level without defining custom winston levels (uses error)
logger.critical = (msg, meta) => {
  logger.error(`[CRITICAL] ${msg}`, meta);
};

export default logger;
