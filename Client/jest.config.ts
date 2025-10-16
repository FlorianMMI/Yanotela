/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "json",
    "text",
    "lcov",
    "clover"
  ],

  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$|@?lexical))"
  ],

  moduleNameMapper: {
    // Handle module aliases
    "^@/(.*)$": "<rootDir>/src/$1",
    
    // Handle CSS imports (with CSS modules)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    
    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
    
    // Handle image imports
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$": "<rootDir>/__mocks__/fileMock.js",
    
    // Handle @next/font
    "@next/font/(.*)": `@next/font/$1`,
    // Handle @next/font/google
    "@next/font/google": "@next/font/google",
  },

  // Module file extensions for modules Jest should understand
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],

  // Patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.(js|jsx|ts|tsx)",
    "**/*.(test|spec).(js|jsx|ts|tsx)"
  ],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/"
  ],

  // Environment options
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
};

export default config;
