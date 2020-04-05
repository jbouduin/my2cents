// rollup.config.js
import buble from 'rollup-plugin-buble';
import copy from 'rollup-plugin-copy';
import commonjs from 'rollup-plugin-commonjs';
import jst from 'rollup-plugin-jst';
import { terser } from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';

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
  outputPath = 'dist/public';
}

var copyPlugin = copy({
  targets: [
    { src: 'src/assets/css', dest: `${outputPath}` },
    { src: 'src/assets/fonts', dest: `${outputPath}` }
  ],
  verbose: true
});

// copyPlugin.buildEnd();
const copyStylesheets = [...plugins];
copyStylesheets.push(copyPlugin);

export default [
    {
      input: 'src/embed/index.js',
      output: {
        file: `${outputPath}/embed/embed.js`,
        format: 'iife'
      },
      output: {
        file: `${outputPath}/embed/embed.min.js`,
        format: 'iife',
        plugins: [ terser() ]
      },
      plugins: plugins
    }, {
      input: 'src/embed/client.js',
      output: {
        file: `${outputPath}/embed/client.js`,
        format: 'umd',
        name: 'My2Cents'
      },
      output: {
        file: `${outputPath}/embed/client.min.js`,
        format: 'umd',
        name: 'My2Cents',
        plugins: [ terser() ]
      },
      plugins: plugins
    },  {
      input: 'src/embed/push.js',
      output: {
        file: `${outputPath}/embed/push.js`,
        format: 'cjs'
      },
      output: {
        file: `${outputPath}/embed/push.min.js`,
        format: 'cjs',
        plugins: [ terser() ]
      },
      plugins: plugins
    }, {
      input: 'src/embed/sw.js',
      output: {
        file: `${outputPath}/embed/sw.js`,
        format: 'cjs'
      },
      output: {
        file: `${outputPath}/embed/sw.min.js`,
        format: 'cjs',
        plugins: [ terser() ]
      },
      plugins: copyStylesheets
    }
  ];
