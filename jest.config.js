/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  // testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/docker/setup.ts'],
  globalSetup: '<rootDir>/src/tests/setup/docker/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/setup/docker/globalTeardown.ts',
  modulePathIgnorePatterns: ['build'],
};
