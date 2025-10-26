import jwt from "jwt-simple";

import { IUserResponse } from "@/types";
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, REFRESH_TOKEN_SECRET } from "@/constants";
import { configLogger } from "@/configs";

export const generateToken = {
    accessToken: (user: IUserResponse) => {
        const { userId, email, username, isAdmin } = user;
        // Calculate expiration time: 1 hour from now (in Unix timestamp)
        const expirationTime = Math.floor(Date.now() / 1000) + (1 * 60 * 60); // 1 hour

        return jwt.encode(
            { userId, email, username, isAdmin, exp: expirationTime },
            JWT_SECRET || configLogger.params.jwtSecret
        ) || '';
    },

    refreshToken: (user: IUserResponse) => {
        const { userId } = user;
        // Calculate refresh token expiration time: 30 days from now (in Unix timestamp)
        const refreshExpirationTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

        const refreshPayload = {
            sub: userId,
            type: 'refresh',
            exp: refreshExpirationTime
        };

        return jwt.encode(refreshPayload, REFRESH_TOKEN_SECRET);
    },

    decodeToken: (token: string) => {
        try {
            return jwt.decode(token, JWT_SECRET);
        } catch (error) {
            throw error;
        }
    }
};
