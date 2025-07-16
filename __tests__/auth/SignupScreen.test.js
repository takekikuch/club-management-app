import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import SignupScreen from '../../screens/SignupScreen';
import { AuthenticatedUserProvider } from '../../providers';

// Mock Firebase auth
jest.mock('firebase/auth');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <NavigationContainer>
    <GluestackUIProvider config={config}>
      <AuthenticatedUserProvider>
        {children}
      </AuthenticatedUserProvider>
    </GluestackUIProvider>
  </NavigationContainer>
);

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Elements', () => {
    test('すべての必要なUI要素が表示される', () => {
      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // フォーム要素の存在確認
      expect(getByPlaceholderText('メールアドレスを入力')).toBeTruthy();
      expect(getByPlaceholderText('パスワードを入力')).toBeTruthy();
      expect(getByPlaceholderText('パスワードを再入力')).toBeTruthy();
      
      // ボタンとリンクの存在確認
      expect(getByText('アカウント作成')).toBeTruthy();
      expect(getByText('既にアカウントをお持ちの方はこちら')).toBeTruthy();
    });

    test('パスワード表示切替ボタンが正常に動作する', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const toggleButton1 = getByTestId('password-toggle');
      const toggleButton2 = getByTestId('confirm-password-toggle');

      // 初期状態ではパスワードが非表示
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);

      // ボタンを押すとパスワードが表示される
      fireEvent.press(toggleButton1);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      fireEvent.press(toggleButton2);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
    });
  });

  describe('フォームバリデーション', () => {
    test('空のフィールドでサインアップを試行するとエラーが表示される', async () => {
      const { getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const signupButton = getByText('アカウント作成');
      fireEvent.press(signupButton);

      // バリデーションエラーの確認
      await waitFor(() => {
        expect(findByText('Email is a required field')).toBeTruthy();
      });
    });

    test('無効なメールアドレス形式でエラーが表示される', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const signupButton = getByText('アカウント作成');

      // 無効なメールアドレスを入力
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(findByText('Email must be a valid email')).toBeTruthy();
      });
    });

    test('短すぎるパスワードでエラーが表示される', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const signupButton = getByText('アカウント作成');

      // 有効なメールと短いパスワードを入力
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(findByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    test('パスワードが一致しない場合にエラーが表示される', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      // パスワードが一致しない情報を入力
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password456');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(findByText('Confirm Password must match password.')).toBeTruthy();
      });
    });
  });

  describe('認証機能', () => {
    test('正しい情報でアカウント作成が成功する', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      createUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      // 有効な情報を入力
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com',
          'password123'
        );
      });
    });

    test('既に存在するメールアドレスでアカウント作成が失敗する', async () => {
      const mockError = new Error('auth/email-already-in-use');
      createUserWithEmailAndPassword.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      // 既存のメールアドレスを入力
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(findByText('このメールアドレスは既に使用されています。')).toBeTruthy();
      });
    });

    test('弱いパスワードでアカウント作成が失敗する', async () => {
      const mockError = new Error('auth/weak-password');
      createUserWithEmailAndPassword.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'weak');
      fireEvent.changeText(confirmPasswordInput, 'weak');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(findByText('パスワードが弱すぎます。より強力なパスワードを設定してください。')).toBeTruthy();
      });
    });

    test('ネットワークエラーでアカウント作成が失敗する', async () => {
      const mockError = new Error('auth/network-request-failed');
      createUserWithEmailAndPassword.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(findByText('ネットワークエラーが発生しました。インターネット接続をご確認ください。')).toBeTruthy();
      });
    });
  });

  describe('ナビゲーション', () => {
    test('「既にアカウントをお持ちの方はこちら」をタップするとログイン画面に遷移する', () => {
      const { getByText } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const loginLink = getByText('既にアカウントをお持ちの方はこちら');
      fireEvent.press(loginLink);

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('ローディング状態', () => {
    test('アカウント作成処理中はローディングインディケーターが表示される', async () => {
      // アカウント作成処理を遅延させるPromise
      let resolveSignup;
      const signupPromise = new Promise(resolve => {
        resolveSignup = resolve;
      });
      createUserWithEmailAndPassword.mockReturnValueOnce(signupPromise);

      const { getByPlaceholderText, getByText, getByTestId } = render(
        <TestWrapper>
          <SignupScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      // ローディングインディケーターが表示されることを確認
      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });

      // アカウント作成処理を完了
      resolveSignup({ user: { uid: 'test-uid' } });

      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });
  });
});