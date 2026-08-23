export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // コミットメッセージのtypeを常に第3引数に限定する
    'type-enum': [
      2,
      'always',
      [
        'fix',
        'feat',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
      ],
    ],
    'subject-case': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
}
