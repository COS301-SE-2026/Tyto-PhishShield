module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: '../tsconfig.json',
            },
        ],
    },
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$',
    clearMocks: true,
    collectCoverage: true,
    coverageProvider: 'v8',
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    coverageDirectory: 'coverage',
};