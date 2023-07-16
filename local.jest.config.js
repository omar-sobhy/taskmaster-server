/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  // testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/local/setup.ts'],
  globalSetup: '<rootDir>/src/tests/setup/local/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/setup/local/globalTeardown.ts',
  modulePathIgnorePatterns: ['build'],
};
