import React from 'react';
import { Spinner, Center } from '@gluestack-ui/themed';
import { ClubThemeTokens } from '../config/theme';

export const LoadingIndicator = ({ size = 'large', color = ClubThemeTokens.secondary, ...props }) => {
  return (
    <Center flex={1} {...props}>
      <Spinner size={size} color={color} />
    </Center>
  );
};
