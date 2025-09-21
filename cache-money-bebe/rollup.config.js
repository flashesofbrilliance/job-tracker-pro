import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from '@rollup/plugin-terser';
import analyzer from 'rollup-plugin-analyzer';
import { visualizer } from 'rollup-plugin-visualizer';

const isProduction = process.env.NODE_ENV === 'production';
const shouldAnalyze = process.env.ANALYZE === 'true';

const commonConfig = {
  input: 'src/index.js',
  external: [],
  plugins: [
    json(),
    nodeResolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['> 1%', 'last 2 versions', 'not dead'],
            node: '16'
          },
          modules: false
        }]
      ]
    }),
    ...(isProduction ? [terser({
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        reserved: ['CacheMoneyBebe', 'RevolvingDoorCache', 'PayloadCacheStrap']
      }
    })] : []),
    ...(shouldAnalyze ? [
      analyzer({
        summaryOnly: true,
        limit: 10
      }),
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true
      })
    ] : [])
  ]
};

export default [
  // UMD build for browsers
  {
    ...commonConfig,
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'CacheMoneyBebe',
      globals: {},
      banner: `/*!
 * cache-money-bebe v${process.env.npm_package_version || '1.0.0'}
 * (c) 2024 cache-money-bebe contributors
 * Released under the MIT License.
 */`
    }
  },
  
  // CommonJS build for Node.js
  {
    ...commonConfig,
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [
      ...commonConfig.plugins.slice(0, -2), // Remove terser and analysis plugins
      ...(isProduction ? [terser()] : [])
    ]
  },
  
  // ES modules build
  {
    ...commonConfig,
    output: {
      file: 'dist/index.esm.js',
      format: 'es'
    },
    plugins: [
      ...commonConfig.plugins.slice(0, -2), // Remove terser and analysis plugins
      ...(isProduction ? [terser()] : [])
    ]
  },
  
  // Minified UMD build for CDN
  {
    ...commonConfig,
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'CacheMoneyBebe',
      globals: {},
      banner: `/*! cache-money-bebe v${process.env.npm_package_version || '1.0.0'} | MIT */`
    },
    plugins: [
      ...commonConfig.plugins,
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info']
        },
        mangle: {
          reserved: ['CacheMoneyBebe']
        }
      })
    ]
  }
];