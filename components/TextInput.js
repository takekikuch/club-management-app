import React from 'react';
import { 
  Input, 
  InputField, 
  InputSlot, 
  InputIcon 
} from '@gluestack-ui/themed';
import { ClubThemeTokens } from '../config/theme';

import { Icon } from './Icon';
import { Button } from './Button';

export const TextInput = ({
  width = '100%',
  leftIconName,
  rightIcon,
  handlePasswordVisibility,
  style,
  ...otherProps
}) => {
  return (
    <Input 
      variant="outline" 
      size="md"
      style={[{ width }, style]}
      {...otherProps}
    >
      {leftIconName ? (
        <InputSlot pl="$3">
          <InputIcon as={() => (
            <Icon
              name={leftIconName}
              size={22}
              color={ClubThemeTokens.textMuted}
            />
          )} />
        </InputSlot>
      ) : null}
      
      <InputField 
        fontSize="$lg"
        {...otherProps}
      />
      
      {rightIcon ? (
        <InputSlot pr="$3">
          <Button onPress={handlePasswordVisibility} variant="link" size="sm">
            <InputIcon as={() => (
              <Icon
                name={rightIcon}
                size={22}
                color={ClubThemeTokens.textMuted}
              />
            )} />
          </Button>
        </InputSlot>
      ) : null}
    </Input>
  );
};
