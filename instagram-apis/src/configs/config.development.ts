import { logger } from "./logger";

export const configLogger = {
    database: "ntask",
    email: "",
    password: "",
    params: {
        dialect: "sqlite",
        storage: "ntask.sqlite",
        loggin: (sql: any) => {
            logger.info(`[${new Date()}] ${sql}`);
        },
        define: {
            undercored: true
        },
        jwtSecret: "Nta$K-AP1",
        jwtSession: {session: false}
    },
}
