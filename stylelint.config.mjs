/**
 * Stylelint for the token file, the reset, and every CSS Module. Starts from
 * stylelint-config-standard and adds the project's rules from `docs/code-style.md`
 * section 8 and `docs/style-guide.md`.
 */
const stylelintConfig = {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    // CSS Modules class names are read in TypeScript as `styles.skipLink`.
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*$",
      { message: "Name classes in camelCase, such as `skipLink` (code-style section 8)." }
    ],
    // Colors come from the token variables, never a literal value.
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "fill", "stroke"],
      {
        expandShorthand: true,
        ignoreValues: ["currentcolor", "transparent", "inherit"],
        disableFix: true,
        message: "Use a color token, such as var(--color-text) (docs/style-guide.md)."
      }
    ],
    "declaration-no-important": true
  },
  overrides: [
    {
      // The token file is where color values are written.
      files: ["src/styles/tokens.css"],
      rules: { "scale-unlimited/declaration-strict-value": null }
    },
    {
      // The reduced motion rule must beat every component's transition.
      files: ["src/styles/reset.css"],
      rules: { "declaration-no-important": null }
    }
  ]
};

export default stylelintConfig;
