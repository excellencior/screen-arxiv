import React from 'react';
import { View } from 'react-native';

export default function AppContainer({ children, ...props }: any) {
  return <View style={{ flex: 1 }} {...props}>{children}</View>;
}
