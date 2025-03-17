const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  output: {
    filename: 'hapi-sdk.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'HapiSDK',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "buffer": require.resolve("buffer/"),
      "crypto": false,
      "stream": false,
      "path": false,
      "fs": false
    }
  },
  externals: {
    '@ton/core': {
      commonjs: '@ton/core',
      commonjs2: '@ton/core',
      amd: '@ton/core',
      root: ['ton']
    },
    '@ton/crypto': {
      commonjs: '@ton/crypto',
      commonjs2: '@ton/crypto',
      amd: '@ton/crypto',
      root: ['ton']
    },
    '@ton/ton': {
      commonjs: '@ton/ton',
      commonjs2: '@ton/ton',
      amd: '@ton/ton',
      root: ['ton']
    }
  }
}; 