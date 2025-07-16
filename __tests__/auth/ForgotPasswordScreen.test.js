import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { sendPasswordResetEmail } from 'firebase/auth';

import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen';
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

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Elements', () => {
    test('すべての必要なUI要素が表示される', () => {
      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // フォーム要素の存在確認
      expect(getByPlaceholderText('メールアドレスを入力')).toBeTruthy();
      
      // ボタンとリンクの存在確認
      expect(getByText('パスワードリセットメールを送信')).toBeTruthy();
      expect(getByText('ログイン画面に戻る')).toBeTruthy();
      
      // 説明文の存在確認
      expect(getByText('登録済みのメールアドレスを入力してください。パスワードリセット用のメールをお送りします。')).toBeTruthy();
    });
  });

  describe('フォームバリデーション', () => {
    test('空のメールフィールドでリセットを試行するとエラーが表示される', async () => {
      const { getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const resetButton = getByText('パスワードリセットメールを送信');
      fireEvent.press(resetButton);

      // バリデーションエラーの確認
      await waitFor(() => {
        expect(findByText('Email is a required field')).toBeTruthy();
      });
    });

    test('無効なメールアドレス形式でエラーが表示される', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      // 無効なメールアドレスを入力
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(findByText('Email must be a valid email')).toBeTruthy();
      });
    });
  });

  describe('パスワードリセット機能', () => {
    test('有効なメールアドレスでリセットメール送信が成功する', async () => {
      sendPasswordResetEmail.mockResolvedValueOnce();

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      // 有効なメールアドレスを入力
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(
          expect.any(Object),
          'test@example.com'
        );
      });

      // 成功メッセージの表示確認
      await waitFor(() => {
        expect(findByText('パスワードリセットメールを送信しました。メールをご確認ください。')).toBeTruthy();
      });

      // 3秒後にログイン画面に遷移することを確認
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Login');
      }, { timeout: 4000 });
    });

    test('存在しないメールアドレスでリセットが失敗する', async () => {
      const mockError = new Error('auth/user-not-found');
      sendPasswordResetEmail.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      // 存在しないメールアドレスを入力
      fireEvent.changeText(emailInput, 'nonexistent@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(findByText('このメールアドレスは登録されていません。')).toBeTruthy();
      });
    });

    test('無効なメールアドレスでリセットが失敗する', async () => {
      const mockError = new Error('auth/invalid-email');
      sendPasswordResetEmail.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      fireEvent.changeText(emailInput, 'invalid@email');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(findByText('メールアドレスの形式が正しくありません。')).toBeTruthy();
      });
    });

    test('リクエスト制限エラーでリセットが失敗する', async () => {
      const mockError = new Error('auth/too-many-requests');
      sendPasswordResetEmail.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(findByText('リクエストが多すぎます。しばらく時間をおいてから再試行してください。')).toBeTruthy();
      });
    });

    test('ネットワークエラーでリセットが失敗する', async () => {
      const mockError = new Error('auth/network-request-failed');
      sendPasswordResetEmail.mockRejectedValueOnce(mockError);

      const { getByPlaceholderText, getByText, findByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(findByText('ネットワークエラーが発生しました。インターネット接続をご確認ください。')).toBeTruthy();
      });
    });
  });

  describe('ナビゲーション', () => {
    test('「ログイン画面に戻る」をタップするとログイン画面に遷移する', () => {
      const { getByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const backToLoginLink = getByText('ログイン画面に戻る');
      fireEvent.press(backToLoginLink);

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('ローディング状態', () => {
    test('リセットメール送信処理中はローディングインディケーターが表示される', async () => {
      // リセットメール送信処理を遅延させるPromise
      let resolveReset;
      const resetPromise = new Promise(resolve => {
        resolveReset = resolve;
      });
      sendPasswordResetEmail.mockReturnValueOnce(resetPromise);

      const { getByPlaceholderText, getByText, getByTestId } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(resetButton);

      // ローディングインディケーターが表示されることを確認
      await waitFor(() => {
        expect(getByTestId('loading-indicator')).toBeTruthy();
      });

      // リセットメール送信処理を完了
      resolveReset();

      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });

    test('送信完了後はボタンが無効化される', async () => {
      sendPasswordResetEmail.mockResolvedValueOnce();

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <ForgotPasswordScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const emailInput = getByPlaceholderText('メールアドレスを入力');
      const resetButton = getByText('パスワードリセットメールを送信');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(resetButton);

      await waitFor(() => {
        expect(resetButton.props.disabled).toBe(true);
      });
    });
  });
});