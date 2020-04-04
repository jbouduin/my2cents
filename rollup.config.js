// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import jst from 'rollup-plugin-jst';

var plugins = [
  jst({
    extensions: ['.html'],
    include: 'src/embed/**.html'
  }),
  commonjs(),
  resolve(),
  buble()
];

var outputPath = 'build';
if ((process.env.NODE_ENV || '').trim() === 'production') {
  outputPath = 'dist/embed';
  plugins.push(uglify());
}

export default [
    {
      input: 'src/embed/index.js',
      output: {
        file: `${outputPath}/embed.js`,
        format: 'iife'
      },
      plugins: plugins
    }, {
      input: 'src/embed/client.js',
      output: {
        file: `${outputPath}/client.js`,
        format: 'umd',
        name: 'My2Cents'
      },
      plugins: plugins
    },  {
      input: 'src/embed/push.js',
      output: {
        file: `${outputPath}/push.js`,
        format: 'cjs'
      },
      plugins: plugins
    }, {
      input: 'src/embed/sw.js',
      output: {
        file: `${outputPath}/sw.js`,
        format: 'cjs'
      },
      plugins: plugins
    }
  ];
