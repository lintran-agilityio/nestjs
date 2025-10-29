import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!dist/**/*',
    '!coverage/**/*',
    '!src/config/*',
    '!src/migrations/*',
    '!src/scripts/*',
    '!src/main.ts',
    '!*.(t|j)s',
    '!**/database.module.ts',
    '!**/health.controller.ts',
    '!**/health.service.ts',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  verbose: true,
  preset: 'ts-jest/presets/js-with-ts-esm',
  testTimeout: 30000,
};

export default config;
