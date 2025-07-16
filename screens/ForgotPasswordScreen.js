import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Formik } from "formik";
import { sendPasswordResetEmail } from "firebase/auth";

import { passwordResetSchema } from "../utils";
import { Colors, auth } from "../config";
import { View, TextInput, Button, FormErrorMessage, LoadingIndicator } from "../components";

export const ForgotPasswordScreen = ({ navigation }) => {
  const [errorState, setErrorState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Firebase エラーメッセージの日本語化
  const getJapaneseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'このメールアドレスは登録されていません。';
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません。';
      case 'auth/too-many-requests':
        return 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。';
      case 'auth/network-request-failed':
        return 'ネットワークエラーが発生しました。インターネット接続をご確認ください。';
      default:
        return 'パスワードリセットメールの送信に失敗しました。しばらく時間をおいてから再試行してください。';
    }
  };

  const handleSendPasswordResetEmail = async (values) => {
    const { email } = values;
    setIsLoading(true);
    setErrorState("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("パスワードリセットメールを送信しました。メールをご確認ください。");
      // 3秒後にログイン画面に自動遷移
      setTimeout(() => {
        navigation.navigate("Login");
      }, 3000);
    } catch (error) {
      setErrorState(getJapaneseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View isSafe style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.screenTitle}>パスワードリセット</Text>
        <Text style={styles.description}>
          登録済みのメールアドレスを入力してください。パスワードリセット用のメールをお送りします。
        </Text>
      </View>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={passwordResetSchema}
        onSubmit={(values) => handleSendPasswordResetEmail(values)}
      >
        {({
          values,
          touched,
          errors,
          handleChange,
          handleSubmit,
          handleBlur,
        }) => (
          <>
            {/* Email input field */}
            <TextInput
              name="email"
              leftIconName="email"
              placeholder="メールアドレスを入力"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={values.email}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
            />
            <FormErrorMessage error={errors.email} visible={touched.email} />
            {/* Display Screen Error Messages */}
            {errorState !== "" ? (
              <FormErrorMessage error={errorState} visible={true} />
            ) : null}
            {/* Display Success Message */}
            {successMessage !== "" ? (
              <FormErrorMessage error={successMessage} visible={true} />
            ) : null}
            {/* Loading indicator */}
            {isLoading && (
              <LoadingIndicator testID="loading-indicator" size="small" />
            )}
            {/* Password Reset Send Email button */}
            <Button 
              style={[styles.button, (isLoading || successMessage) && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={isLoading || successMessage}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'メール送信中...' : 'パスワードリセットメールを送信'}
              </Text>
            </Button>
          </>
        )}
      </Formik>
      {/* Button to navigate to Login screen */}
      <Button
        style={styles.borderlessButtonContainer}
        borderless
        title={"ログイン画面に戻る"}
        onPress={() => navigation.navigate("Login")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
  },
  innerContainer: {
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.black,
    paddingTop: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.mediumGray,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: Colors.orange,
    padding: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.mediumGray,
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: "700",
  },
  borderlessButtonContainer: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
