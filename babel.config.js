module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        'react-native-reanimated/plugin',
        [
            'module-resolver',
            {
                root: ['./'],
                extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
                alias: {
                    '@': './src',
                    '@components': './src/components',
                    '@screens': './src/screens',
                    '@services': './src/services',
                    '@hooks': './src/hooks',
                    '@types': './src/types',
                    '@constants': './src/constants',
                    '@utils': './src/utils',
                    '@assets': './assets',
                },
            },
        ],
    ],
};
