import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const View = ({ isSafe, style, children, ...props }) => {
  const insets = useSafeAreaInsets();

  if (isSafe) {
    return (
      <Box 
        style={[{ paddingTop: insets.top }, style]} 
        {...props}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box 
      style={style} 
      {...props}
    >
      {children}
    </Box>
  );
};
