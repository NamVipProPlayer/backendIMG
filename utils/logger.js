/**
 * Simple logger utility for the shoe store application
 * Provides consistent logging across the application with different log levels
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Set the current log level based on environment
// In production, only show errors and warnings
// In development, show all logs
const currentLevel =
  process.env.NODE_ENV === "production" ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

/**
 * Format log message with timestamp, level and content
 * @param {string} level - Log level
 * @param {Array} args - Log message arguments
 * @returns {string} Formatted log message
 */
function formatLog(level, args) {
  const timestamp = new Date().toISOString();
  const messages = args.map((arg) =>
    typeof arg === "object" ? JSON.stringify(arg) : arg
  );
  return `[${timestamp}] [${level}] ${messages.join(" ")}`;
}

/**
 * Log error messages
 * @param {...any} args - Error message and data
 */
function error(...args) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    console.error(formatLog("ERROR", args));
  }
}

/**
 * Log warning messages
 * @param {...any} args - Warning message and data
 */
function warn(...args) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(formatLog("WARN", args));
  }
}

/**
 * Log informational messages
 * @param {...any} args - Info message and data
 */
function info(...args) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.info(formatLog("INFO", args));
  }
}

/**
 * Log debug messages
 * @param {...any} args - Debug message and data
 */
function debug(...args) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.log(formatLog("DEBUG", args));
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
};
