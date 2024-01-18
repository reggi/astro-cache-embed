module.exports = {
  env: { browser: true, node: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', "plugin:astro/recommended",],
  overrides: [
    {
      // Define the configuration for `.astro` file.
      files: ["*.astro"],
      // Allows Astro components to be parsed.
      parser: "astro-eslint-parser",
      // Parse the script in `.astro` as TypeScript by adding the following configuration.
      // It's the setting you need when using TypeScript.
      parserOptions: {
        extraFileExtensions: [".astro"],
        parser: "@typescript-eslint/parser",
      },
      rules: {
        // override/add rules settings here, such as:
        // "astro/no-set-html-directive": "error"
      },
    },
    // ...
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error"
      {
        "argsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
      }
    ],
    "@typescript-eslint/sort-type-constituents": "error",
    "semi": [2, "always"],
    "sort-keys": "error",
  },
};
