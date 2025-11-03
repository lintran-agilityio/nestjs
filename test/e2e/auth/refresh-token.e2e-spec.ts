// libs
import {
  INestApplication,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';

// Apis
import { AuthController } from '@app/apis/auth/auth.controller';
import { AuthService } from '@app/apis/auth/auth.service';

// App sources
import { MESSAGES } from '@app/shared/constants';
import { configureApp, url } from '@e2e/helpers/app';
import { MockHandleErrorArgs } from '@app/shared/interfaces';
import { MOCKING_TOKEN } from '@app/shared/mocks';

jest.mock('@app/shared/utils/error.utils', () => {
  const handleErrorException = jest.fn((args: MockHandleErrorArgs = {}) => {
    const { ExceptionClass, defaultMessage } = args;
    if (ExceptionClass) {
      throw new ExceptionClass(defaultMessage ?? 'Validation error');
    }
    throw new Error(defaultMessage ?? 'Validation error');
  });
  return { handleErrorException };
});

describe('Auth - Refresh Token (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  const mockAuthService = {
    refreshTokens: jest.fn<Promise<{ accessToken: string }>, [string]>(),
  };

  const REFRESH_PATH = 'auth/refresh';
  const { USER_INVALID_REFRESH_TOKEN, USER_TOKEN_EXPIRED, USER_NOT_FOUND } =
    MESSAGES;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);

    await app.init();
    server = app.getHttpServer() as unknown as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/refresh', () => {
    const validRefreshToken = `${MOCKING_TOKEN}.eyJpZCI6IjExMTExMTExLTExMTEtMTExMS0xMTExLTExMTExMTExMTExMSIsImVtYWlsIjoibGluKzAxQGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwic3RhdHVzIjoiQUNUSVZFIiwiaWF0IjoxNzM2Njk2MDAwLCJleHAiOjE3Mzc0NzYwMDB9.valid_signature`;
    const validNewAccessToken = `${MOCKING_TOKEN}.new.access.token`;

    const mockRefreshResponse = {
      accessToken: validNewAccessToken,
    };

    it('should return 200 and new access token with valid refresh token', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockResolvedValueOnce(mockRefreshResponse);

      // Act & Assert
      const res = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: validRefreshToken })
        .expect(HttpStatus.OK);

      const body = res.body as { accessToken: string };

      expect(body).toEqual(mockRefreshResponse);
      expect(body).toHaveProperty('accessToken');
      expect(typeof body.accessToken).toBe('string');
      expect(body.accessToken).toBe(validNewAccessToken);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        validRefreshToken,
      );
    });

    it('should return 401 when refresh token is invalid', async () => {
      // Arrange
      const invalidRefreshToken = 'invalid.token.string';

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: invalidRefreshToken })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        invalidRefreshToken,
      );
    });

    it('should return 401 when refresh token is expired', async () => {
      // Arrange
      const expiredRefreshToken = `${MOCKING_TOKEN}.expired.token`;

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_TOKEN_EXPIRED);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: expiredRefreshToken })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        expiredRefreshToken,
      );
    });

    it('should return 401 when user is not found', async () => {
      // Arrange
      const refreshTokenWithoutUser = `${MOCKING_TOKEN}.token_without_user`;

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_NOT_FOUND);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: refreshTokenWithoutUser })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when refresh token does not match stored hash', async () => {
      // Arrange
      const mismatchedRefreshToken = `${MOCKING_TOKEN}.mismatched.token`;

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: mismatchedRefreshToken })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when refresh token is missing in request body', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({})
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(undefined);
    });

    it('should return 401 when request body is completely empty', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send(null)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when refresh token is null', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: null })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when refresh token is empty string', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: '' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('');
    });

    it('should return 401 when refresh token is not a string', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: 12345 })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(12345);
    });

    it('should return 401 when refresh token is an array', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: ['token1', 'token2'] })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when refresh token is an object', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: { token: 'value' } })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should handle extra properties in request body gracefully', async () => {
      // Arrange
      const payload = {
        refreshToken: validRefreshToken,
        extraField: 'should be ignored',
      };

      mockAuthService.refreshTokens.mockResolvedValueOnce(mockRefreshResponse);

      // Act & Assert
      const res = await request(server)
        .post(url(REFRESH_PATH))
        .send(payload)
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('accessToken');
      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      // Only refreshToken is extracted, extra fields are ignored
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        validRefreshToken,
      );
    });

    it('should handle concurrent refresh requests', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockResolvedValue(mockRefreshResponse);

      // Act
      const requests = Array.from({ length: 3 }, () =>
        request(server)
          .post(url(REFRESH_PATH))
          .send({ refreshToken: validRefreshToken }),
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((res) => {
        const body = res.body as { accessToken: string };
        expect(res.status).toBe(HttpStatus.OK);
        expect(body).toHaveProperty('accessToken');
        expect(typeof body.accessToken).toBe('string');
      });

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(3);
    });

    it('should return a different access token on each refresh', async () => {
      // Arrange
      const accessToken1 = 'token1';
      const accessToken2 = 'token2';
      const accessToken3 = 'token3';

      mockAuthService.refreshTokens
        .mockResolvedValueOnce({ accessToken: accessToken1 })
        .mockResolvedValueOnce({ accessToken: accessToken2 })
        .mockResolvedValueOnce({ accessToken: accessToken3 });

      // Act
      const response1 = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: validRefreshToken })
        .expect(HttpStatus.OK);

      const response2 = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: validRefreshToken })
        .expect(HttpStatus.OK);

      const response3 = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: validRefreshToken })
        .expect(HttpStatus.OK);

      // Assert
      const body1 = response1.body as { accessToken: string };
      const body2 = response2.body as { accessToken: string };
      const body3 = response3.body as { accessToken: string };

      expect(body1.accessToken).toBe(accessToken1);
      expect(body2.accessToken).toBe(accessToken2);
      expect(body3.accessToken).toBe(accessToken3);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(3);
    });

    it('should handle malformed JWT token', async () => {
      // Arrange
      const malformedToken = 'not.a.valid.jwt.token';

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: malformedToken })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace in refresh token', async () => {
      // Arrange
      const tokenWithWhitespace = ` ${validRefreshToken} `;

      mockAuthService.refreshTokens.mockResolvedValueOnce(mockRefreshResponse);

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: tokenWithWhitespace })
        .expect(HttpStatus.OK);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        tokenWithWhitespace,
      );
    });

    it('should handle refresh with special characters in token', async () => {
      // Arrange
      const specialToken = `${MOCKING_TOKEN}.test-token_with.special@chars#123`;

      mockAuthService.refreshTokens.mockResolvedValueOnce(mockRefreshResponse);

      // Act & Assert
      const res = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: specialToken })
        .expect(HttpStatus.OK);

      expect(res.body).toHaveProperty('accessToken');
      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should handle very long refresh token', async () => {
      // Arrange
      const longToken = 'a'.repeat(5000);

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: longToken })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(longToken);
    });

    it('should maintain stateless nature of refresh endpoint', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockResolvedValue(mockRefreshResponse);

      // Act
      const response1 = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: validRefreshToken });

      const response2 = await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: validRefreshToken });

      // Assert
      expect(response1.status).toBe(HttpStatus.OK);
      expect(response2.status).toBe(HttpStatus.OK);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(2);
    });

    it('should return 401 when refresh token field is boolean', async () => {
      // Arrange
      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: true })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(true);
    });

    it('should handle token with control characters', async () => {
      // Arrange
      const tokenWithControlChars = 'token\nwith\rtab\tchars';

      mockAuthService.refreshTokens.mockImplementation(() => {
        throw new UnauthorizedException(USER_INVALID_REFRESH_TOKEN);
      });

      // Act & Assert
      await request(server)
        .post(url(REFRESH_PATH))
        .send({ refreshToken: tokenWithControlChars })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });
  });
});
