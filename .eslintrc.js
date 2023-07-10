module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
        'node': true
    },
    'extends': [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaVersion': 13,
        'sourceType': 'module',
        'project': `${__dirname}/tsconfig.json`
    },
    'plugins': [
        '@typescript-eslint'
    ],
    'rules': {
        'semi': ['error', 'always'],
        'quotes': ['error', 'single'],
        'no-console': ['off'],
        '@typescript-eslint/no-use-before-define': ['off'],
        'no-underscore-dangle': ['off']
    }
};
