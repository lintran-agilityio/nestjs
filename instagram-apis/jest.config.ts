import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest", {
        tsconfig: "tsconfig.jest.json",
        diagnostics: false
      }
    ]
  },
  testTimeout: 10000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    "node_modules/(?!.*)"
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!<rootDir>/src/configs/',
    '!<rootDir>/src/constants/environment.ts',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
    '<rootDir>/src/configs/',
    '<rootDir>/src/entities/',
    '<rootDir>/src/server.ts',
    '<rootDir>/src/apiDoc/swapper.ts',
    '<rootDir>/src/app.ts',
    '<rootDir>/src/db/.*',
    '<rootDir>/src/logs/.*',
    '<rootDir>/src/constants/environment.ts',
  ],
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};

export default config;
