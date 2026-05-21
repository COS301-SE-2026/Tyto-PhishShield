import type { Config } from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: '../coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'json', 'ts'],

  // The root directory that Jest should scan for tests and modules within
  rootDir: 'src',

  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: '.*\\.spec\\.ts$',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['**/*.(t|j)s'],

  // The test environment that will be used for testing
  testEnvironment: 'node',
};

export default config;
