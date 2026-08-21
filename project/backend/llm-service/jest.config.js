"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
                tsconfig: '<rootDir>/tsconfig.json',
            }],
    },
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coverageDirectory: '<rootDir>/coverage',
    testEnvironment: 'node',
    clearMocks: true,
    collectCoverage: true,
    coverageProvider: 'v8',
};
exports.default = config;
//# sourceMappingURL=jest.config.js.map