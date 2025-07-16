import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

import LoginScreen from '../../screens/LoginScreen';
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

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Elements', () => {
    test('すべての必要なUI要素が表示される', () => {
      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // フォーム要素の存在確認
      expect(getByPlaceholderText('メールアドレスを入力')).toBeTruthy();
      expect(getByPlaceholderText('パスワードを入力')).toBeTruthy();
      
      // ボタンとリンクの存在確認
      expect(getByText('ログイン')).toBeTruthy();
      expect(getByText('アカウントをお持ちでない方はこちら')).toBeTruthy();
      expect(getByText('パスワードを忘れた方はこちら')).toBeTruthy();
    });

    test('パスワード表示切替ボタンが正常に動作する', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const passwordInput = getByPlaceholderText('パスワードを入力');
      const toggleButton = getByTestId('password-toggle');

      // 初期状態ではパスワードが非表示
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // ボタンを押すとパスワードが表示される
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // もう一度押すと非表示になる
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('フォームバリデーション', () => {
    test('空のフィールドでログインを試行するとエラーが表示される', async () => {
      const { getByText, findByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const loginButton = getByText('ログイン');
      fireEvent.press(loginButton);

      // バリデーションエラーの確認
      await waitFor(() => {
        expect(findByText('Email is a required field')).toBeTruthy();
      });
    });

    test('無効なメールアドレス形式でエラーが表示される', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const loginButton = getByText('ログイン');

      // 無効なメールアドレスを入力
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText('Email must be a valid email')).toBeTruthy();
      });
    });

    test('短すぎるパスワードでエラーが表示される', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const loginButton = getByText('ログイン');

      // 有効なメールと短いパスワードを入力
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });
  });

  describe('認証機能', () => {
    test('正しい認証情報でログインが成功する', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const loginButton = getByText('ログイン');

      // 有効な認証情報を入力
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com',
          'password123'
        );
      });
    });

    test('無効な認証情報でログインが失敗する', async () => {
      const mockError = new Error('auth/invalid-credential');
      signInWithEmailAndPassword.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const loginButton = getByText('ログイン');

      // 無効な認証情報を入力
      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText('認証に失敗しました。メールアドレスとパスワードをご確認ください。')).toBeTruthy();
      });
    });

    test('ネットワークエラーでログインが失敗する', async () => {
      const mockError = new Error('auth/network-request-failed');
      signInWithEmailAndPassword.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const loginButton = getByText('ログイン');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText('ネットワークエラーが発生しました。インターネット接続をご確認ください。')).toBeTruthy();
      });
    });
  });

  describe('ナビゲーション', () => {
    test('「アカウントをお持ちでない方はこちら」をタップするとサインアップ画面に遷移する', () => {
      const { getByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const signupLink = getByText('アカウントをお持ちでない方はこちら');
      fireEvent.press(signupLink);

      expect(mockNavigate).toHaveBeenCalledWith('Signup');
    });

    test('「パスワードを忘れた方はこちら」をタップするとパスワードリセット画面に遷移する', () => {
      const { getByText } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const forgotPasswordLink = getByText('パスワードを忘れた方はこちら');
      fireEvent.press(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('ローディング状態', () => {
    test('ログイン処理中はローディングインディケーターが表示される', async () => {
      // ログイン処理を遅延させるPromise
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      signInWithEmailAndPassword.mockReturnValueOnce(loginPromise);

      const { getByPlaceholderText, getByText, getByTestId } = render(
        <TestWrapper>
          <LoginScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const passwordInput = getByPlaceholderText('パスワードを入力');
      const loginButton = getByText('ログイン');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // ローディングインディケーターが表示されることを確認
      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });

      // ログイン処理を完了
      resolveLogin({ user: { uid: 'test-uid' } });

      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });
  });
});