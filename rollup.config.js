// rollup.config.js
import buble from 'rollup-plugin-buble';
import copy from 'rollup-plugin-copy';
import commonjs from 'rollup-plugin-commonjs';
import jst from 'rollup-plugin-jst';
import uglify from 'rollup-plugin-uglify';
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
  plugins.push(uglify());
}
/* ************************************************************************** */
/* this does not work, rollup copy is not copying anything                    */
/* ************************************************************************** */
/*
  const copyStylesheets = [...plugins];
  copyStylesheets.push(
  copy({
    targets: [
      { src: './src/css/test.css', dest: `./${outputPath}/public` }
    ],
    verbose: true
  })
);
*/
/* ************************************************************************** */
/* but if I call  buildEnd() myself, it works                                 */
/* ************************************************************************** */
copy({
  targets: [
    { src: 'src/assets/css', dest: `${outputPath}` },
    { src: 'src/assets/fonts', dest: `${outputPath}` }
  ],
  verbose: true
}).buildEnd();

export default [
    {
      input: 'src/embed/index.js',
      output: {
        file: `${outputPath}/embed/embed.js`,
        format: 'iife'
      },
      plugins: plugins
    }, {
      input: 'src/embed/client.js',
      output: {
        file: `${outputPath}/embed/client.js`,
        format: 'umd',
        name: 'My2Cents'
      },
      plugins: plugins
    },  {
      input: 'src/embed/push.js',
      output: {
        file: `${outputPath}/embed/push.js`,
        format: 'cjs'
      },
      plugins: plugins
    }, {
      input: 'src/embed/sw.js',
      output: {
        file: `${outputPath}/embed/sw.js`,
        format: 'cjs'
      },
      plugins: plugins
    }
  ];
