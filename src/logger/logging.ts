import { injectable } from 'inversify'; // For dependency injection
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

export type LogMessage = string;

export type LogContext = object;

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
}

@injectable() // Coming from inversify
export class Logging {
    private _logger: winston.Logger;
    private static _appName = process.env.APP_NAME;

    constructor() {
        this._logger = this._initializeWinston();
    }

    private _getCallerInfo() {
        const stackTrace = Error.captureStackTrace;
        const prepareStackTrace = Error.prepareStackTrace;
        
        Error.prepareStackTrace = (_, stack) => stack;
        const stack = new Error().stack as unknown as NodeJS.CallSite[];
        Error.prepareStackTrace = prepareStackTrace;

        // Get the caller frame (index 3 skips internal calls)
        const caller = stack[3];

        if (caller) {
            const fileName = caller.getFileName() || '';
            const lineNumber = caller.getLineNumber() || '';
            const columnNumber = caller.getColumnNumber() || '';
            
            // Convert absolute path to relative path
            const relativePath = path.relative(process.cwd(), fileName);
            
            return {
                file: relativePath,
                line: lineNumber,
                column: columnNumber,
                function: caller.getFunctionName() || '<anonymous>'
            };
        }
        
        return null;
    }

    public logInfo(msg: LogMessage, context?: LogContext) {
        const caller = this._getCallerInfo();
        this._log(msg, LogLevel.INFO, { ...context, caller });
    }
    public logWarn(msg: LogMessage, context?: LogContext) {
        const caller = this._getCallerInfo();
        this._log(msg, LogLevel.WARN, { ...context, caller });
    }
    public logError(msg: LogMessage, context?: LogContext) {
        const caller = this._getCallerInfo();
        this._log(msg, LogLevel.ERROR, { ...context, caller });
    }
    public logDebug(msg: LogMessage, context?: LogContext) {
        if (process.env.NODE_ENV !== 'production') {
            const caller = this._getCallerInfo();
            this._log(msg, LogLevel.DEBUG, { ...context, caller });
        }
    }

    private _log(msg: LogMessage, level: LogLevel, context?: LogContext) {
        this._logger.log(level, msg, { context });
    }

    private _initializeWinston() {
        const logger = winston.createLogger({
            transports: Logging._getTransports(),
        });
        return logger;
    }

    private static _getTransports() {
        const transports: Array<any> = [
            new winston.transports.Console({
                format: this._getFormatForConsole(),
            }),
        ];

        if (process.env.NODE_ENV === 'production') {
            transports.push(this._getFileTransport()); // Also log file in production
        }

        return transports;
    }

    private static _getFormatForConsole() {
        return format.combine(
            format.timestamp(),
            format.printf(info => {
                //@ts-ignore
                const caller = info.context?.caller;
                
                const callerInfo = caller 
                    ? `[${caller.file}:${caller.line}]` 
                    : '';
                
                return `[${info.timestamp}] ${callerInfo} [${info.level.toUpperCase()}]: ${
                    info.message
                } [CONTEXT] -> ${
                    info.context ? '\n' + JSON.stringify(
                        { ...info.context, caller: undefined }, 
                        null, 
                        2
                    ) : '{}'
                }`;
            }),
            format.colorize({ all: true })
        );
    }

    private static _getFileTransport() {
        return new DailyRotateFile({
            filename: `${Logging._appName}-%DATE%.log`,
            zippedArchive: true, // Compress gzip
            maxSize: '10m', // Rotate after 10MB
            maxFiles: '14d', // Only keep last 14 days
            format: format.combine(
                format.timestamp(),
                format(info => {
                    console.log(info);
                    info.app = this._appName;
                    return info;
                })(),
                format.json()
            ),
        });
    }
}