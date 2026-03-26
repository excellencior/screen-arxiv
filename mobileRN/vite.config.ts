import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Handle JSX in .js files from node_modules (e.g. react-native-toast-message)
      include: [/\.tsx?$/, /\.jsx?$/],
    }),
  ],
  resolve: {
    alias: [
      // Stub native-only packages with web-compatible replacements
      {
        find: /^react-native-safe-area-context$/,
        replacement: path.resolve(__dirname, 'src/web-stubs/react-native-safe-area-context.tsx'),
      },
      // Main alias: react-native -> our proxy stub
      { find: /^react-native$/, replacement: path.resolve(__dirname, 'src/web-stubs/react-native.ts') },
      { find: /^lucide-react-native$/, replacement: 'lucide-react' },
      // Stub internal react-native paths that don't exist in react-native-web
      {
        find: /^react-native\/Libraries\/ReactNative\/AppContainer$/,
        replacement: path.resolve(__dirname, 'src/web-stubs/AppContainer.tsx'),
      },
      {
        find: /^react-native\/Libraries\/Utilities\/codegenNativeComponent$/,
        replacement: path.resolve(__dirname, 'src/web-stubs/codegenNativeComponent.ts'),
      },
      // Catch other deep react-native imports
      { find: /^react-native\/(.+)/, replacement: 'react-native-web/$1' },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  define: {
    __DEV__: JSON.stringify(true),
    'process.env.NODE_ENV': JSON.stringify('development'),
    global: 'window',
  },
  server: {
    port: 19006,
  },
});
