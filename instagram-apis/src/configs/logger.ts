import fs from 'fs';
import winston from 'winston';

const logDir = 'logs';

if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir);
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

export const logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: `${logDir}/app.log`,
            maxsize: 1048576,
            maxFiles: 10
        })
    ]
});
