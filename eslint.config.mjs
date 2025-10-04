import antfu from "@antfu/eslint-config";

export default antfu({
  typescript: true,
  rules: { "no-new": "off", "ts/explicit-function-return-type": "error" },
  stylistic: { semi: true, quotes: "double" },
});
