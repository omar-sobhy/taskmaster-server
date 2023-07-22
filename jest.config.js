/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  // testEnvironment: 'node',
  // setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  modulePathIgnorePatterns: ['build'],
  testEnvironment: '<rootDir>/src/tests/TaskmasterEnvironment.ts',
};
