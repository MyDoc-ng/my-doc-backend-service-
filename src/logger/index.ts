import { Container } from 'inversify';
import { Logging } from './logging'; // Assuming you put the Logging class in logging.ts

// Create a new container
const container = new Container();
container.bind(Logging).toSelf();

// Get the logger instance
const logger = container.get(Logging);

// Create an adapter to match our previous Logger interface
const loggerAdapter = {
    info: (message: string, context?: object) => logger.logInfo(message, context),
    error: (message: string, context?: object) => logger.logError(message, context),
    warn: (message: string, context?: object) => logger.logWarn(message, context),
    debug: (message: string, context?: object) => logger.logDebug(message, context)
};

export default loggerAdapter;