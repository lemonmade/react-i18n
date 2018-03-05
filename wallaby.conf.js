module.exports = function(wallaby) {
  return {
    files: [
      'tsconfig.json',
      'config/**/*',
      'tests/**/*.ts?(x)',
      'src/**/*.ts?(x)',
      {pattern: 'src/**/*.test.ts?(x)', ignore: true},
    ],
    tests: ['src/**/*.test.ts?(x)'],
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
    setup(wallaby) {
      const path = require('path');

      wallaby.testFramework.configure({
        rootDir: wallaby.projectCacheDir,
        setupFiles: [path.join(wallaby.projectCacheDir, 'tests/setup.ts')],
        moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
        transform: {
          '\\.tsx?$': 'ts-jest/preprocessor.js',
        },
        moduleNameMapper: {
          '^tests/(.*)': path.join(wallaby.localProjectDir, 'tests/$1'),
        },
      });
    },
  };
};
