export * from 'react-native-web';
import * as ReactNativeWeb from 'react-native-web';

export const codegenNativeComponent = () => 'View';
export const codegenNativeCommands = () => ({});
export const TurboModuleRegistry = { get: () => null, getEnforcing: () => null };

export default {
  ...ReactNativeWeb,
  codegenNativeComponent,
  codegenNativeCommands,
  TurboModuleRegistry,
};
