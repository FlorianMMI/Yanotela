module.exports = {
  presets: [
    "@babel/preset-env", // Transpile modern JavaScript
    [
      "@babel/preset-react",
      {
        runtime: "automatic" // enables JSX transform without explicit React import
      }
    ],
    "@babel/preset-typescript", // Transpile TypeScript
  ],
};
