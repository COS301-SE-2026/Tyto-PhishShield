const base = require('./jest.base.cjs');

module.exports = {
  ...base,
  testTimeout: 60000,
  transformIgnorePatterns: [
    'node_modules/\\.pnpm/(?!(jose|jwks-rsa)@)'
    ]
};