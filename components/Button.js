import React from 'react';
import { Button as GluestackButton, ButtonText } from '@gluestack-ui/themed';
import { ClubThemeTokens } from '../config/theme';

export const Button = ({
  children,
  onPress,
  borderless = false,
  title,
  style,
  ...props
}) => {
  if (borderless) {
    return (
      <GluestackButton 
        variant="link" 
        onPress={onPress} 
        style={style}
        {...props}
      >
        <ButtonText color={ClubThemeTokens.primary}>{title}</ButtonText>
      </GluestackButton>
    );
  }

  if (title) {
    return (
      <GluestackButton 
        onPress={onPress} 
        style={style}
        {...props}
      >
        <ButtonText>{title}</ButtonText>
      </GluestackButton>
    );
  }

  return (
    <GluestackButton 
      onPress={onPress} 
      style={style}
      {...props}
    >
      {children}
    </GluestackButton>
  );
};
