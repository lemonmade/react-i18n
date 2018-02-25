module.exports = {
  extends: [
    'plugin:shopify/typescript-react',
    'plugin:shopify/typescript-prettier',
    'plugin:shopify/jest',
  ],
  rules: {
    // I18n is PascalCase IMO
    'typescript/class-name-casing': 'off',
    // Doesn't handle import = require() statements
    'import/first': 'off',
    // This is just a bad rule
    'promise/always-return': 'off',
  },
};
