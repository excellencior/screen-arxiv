// index.web.tsx – entry point for react-native-web (Vite)
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('screenArxivNative', () => App);
AppRegistry.runApplication('screenArxivNative', {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});
