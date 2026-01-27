module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 60000, // 60 seconds for E2E tests
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Test groups
    projects: [
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
            testTimeout: 5000
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
            testTimeout: 10000
        },
        {
            displayName: 'e2e',
            testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
            testTimeout: 120000
        }
    ]
};
