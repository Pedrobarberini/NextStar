import React, { useState } from "react";
import { Check, LogIn, UserPlus } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { ScreenBackdrop, ScreenTransition } from "../components/AppShell";
import { LabeledInput } from "../components/Navigation";
import { GOOGLE_SIGNIN_ICON, XOLOT_WORDMARK } from "../constants/assets";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import {
  AccountCompletionRequiredError,
  createFirebaseAccountMetadata,
  getCurrentFirebaseUser,
  getSafeFirebaseAuthMessage,
  hasFirebaseAccount,
  registerWithEmailAndPassword,
  sendFirebasePasswordReset,
  signInWithEmailAndPasswordSecurely,
  signOutFirebaseSession
} from "../services/firebaseAccountService";
import { loadFirebaseAppUser } from "../services/firebaseProfileService";
import {
  GoogleAuthCancelledError,
  GoogleAuthConfigurationError
} from "../services/googleAuth";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import type { AppUser } from "../types";
import {
  getPasswordRequirements,
  isStrongPassword
} from "../utils/passwordValidation";

type AuthMode = "create" | "login";

export function AuthScreen({
  onComplete
}: {
  onComplete: (user: AppUser) => void;
}) {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsAccountCompletion, setNeedsAccountCompletion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    isAvailable: isGoogleAvailable,
    isReady: isGoogleReady,
    isSigningIn: isGoogleSigningIn,
    signInWithGoogle
  } = useGoogleSignIn();
  const isCompact = width < 380;
  const cleanEmail = email.trim().toLowerCase();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const passwordRequirements = getPasswordRequirements(password);
  const hasStrongPassword = isStrongPassword(password);
  const hasValidPassword = mode === "login" ? password.length >= 1 : hasStrongPassword;
  const isBusy = isSubmitting || isGoogleSigningIn;
  const mustAcceptTerms = mode === "create" || needsAccountCompletion;
  const canContinue =
    hasValidEmail &&
    hasValidPassword &&
    (mode === "login" || password === passwordConfirmation) &&
    (!mustAcceptTerms || acceptedTerms) &&
    !isBusy;
  const canContinueWithGoogle =
    !isBusy && isGoogleAvailable && isGoogleReady;

  function clearFeedback() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    clearFeedback();
    setPassword("");
    setPasswordConfirmation("");
    setAcceptedTerms(false);
    setNeedsAccountCompletion(false);
  }

  async function handleGooglePress() {
    clearFeedback();

    if (!isGoogleAvailable) {
      Alert.alert(
        "Login com o Google",
        "Configure o Firebase no arquivo .env e reinicie o Expo."
      );
      return;
    }

    if (mode === "create" && !acceptedTerms) {
      setErrorMessage("Aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    try {
      await signInWithGoogle();

      const firebaseUser = getCurrentFirebaseUser();

      if (!firebaseUser) {
        throw new Error("O Firebase não retornou uma sessão válida.");
      }

      const hasAccount = await hasFirebaseAccount(firebaseUser.uid);
      if (!hasAccount) {
        if (mode !== "create") {
          await signOutFirebaseSession();
          setErrorMessage(
            "Esta identidade ainda não possui uma conta Xolot. Selecione “Cadastrar”."
          );
          return;
        }

        await createFirebaseAccountMetadata(firebaseUser, acceptedTerms);
      }

      onComplete(await loadFirebaseAppUser(firebaseUser));
    } catch (error) {
      if (error instanceof GoogleAuthCancelledError) {
        return;
      }

      if (error instanceof GoogleAuthConfigurationError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(getSafeFirebaseAuthMessage(error));
    }
  }

  async function submitAuth() {
    if (!canContinue) {
      return;
    }

    clearFeedback();
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await registerWithEmailAndPassword(
          cleanEmail,
          password,
          acceptedTerms
        );
        setMode("login");
        setPassword("");
        setPasswordConfirmation("");
        setAcceptedTerms(false);
        setSuccessMessage(
          "Cadastro recebido. Confirme o link enviado ao seu e-mail para ativar sua conta."
        );
        return;
      }

      const firebaseUser = await signInWithEmailAndPasswordSecurely(
        cleanEmail,
        password,
        needsAccountCompletion && acceptedTerms
      );
      setNeedsAccountCompletion(false);
      onComplete(await loadFirebaseAppUser(firebaseUser));
    } catch (error) {
      if (error instanceof AccountCompletionRequiredError) {
        setNeedsAccountCompletion(true);
        setAcceptedTerms(false);
        setErrorMessage(
          "Sua identidade foi encontrada. Aceite os termos abaixo para concluir a conta Xolot."
        );
        return;
      }

      setErrorMessage(getSafeFirebaseAuthMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    clearFeedback();

    if (!hasValidEmail) {
      setErrorMessage("Informe um e-mail válido para recuperar a senha.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendFirebasePasswordReset(cleanEmail);
      setSuccessMessage(
        "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação."
      );
    } catch (error) {
      const message = getSafeFirebaseAuthMessage(error);
      if (
        message.includes("conexão") ||
        message.includes("tentativas") ||
        message.includes("configurado")
      ) {
        setErrorMessage(message);
      } else {
        setSuccessMessage(
          "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const submitLabel = needsAccountCompletion
    ? "Concluir cadastro"
    : mode === "login"
      ? "Entrar"
      : "Criar conta";
  const SubmitIcon = mode === "login" && !needsAccountCompletion ? LogIn : UserPlus;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.authShell}
    >
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={styles.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTransition style={styles.authCard}>
          <View style={styles.authTopRow}>
            <Text style={styles.authPanelKicker}>Talentos em movimento</Text>
            <View style={styles.authModePill}>
              <Text style={styles.authModeText}>
                {mode === "login" ? "Login" : "Cadastro"}
              </Text>
            </View>
          </View>
          <Image
            accessibilityLabel="Logo Xolot"
            resizeMode="contain"
            source={XOLOT_WORDMARK}
            style={[styles.authLogo, isCompact ? styles.authLogoCompact : null]}
          />
          <Text style={styles.authEyebrow}>Descubra. Avalie. Conecte.</Text>
          <Text style={styles.authTitle}>
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </Text>

          <View style={styles.authSocialRow}>
            <Pressable
              accessibilityLabel="Continuar com o Google"
              accessibilityRole="button"
              disabled={!canContinueWithGoogle}
              onPress={() => void handleGooglePress()}
              style={[
                styles.authSocialButton,
                !canContinueWithGoogle ? styles.authSocialButtonDisabled : null
              ]}
            >
              {isGoogleSigningIn ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Image
                  accessibilityIgnoresInvertColors
                  source={GOOGLE_SIGNIN_ICON}
                  style={styles.authSocialIcon}
                />
              )}
              <Text style={styles.authSocialButtonText}>Google</Text>
            </Pressable>
          </View>

          <View style={styles.authDivider}>
            <View style={styles.authDividerLine} />
            <Text style={styles.authDividerText}>ou use seu e-mail</Text>
            <View style={styles.authDividerLine} />
          </View>

          <LabeledInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="E-mail"
            onChangeText={(value) => {
              setEmail(value);
              setNeedsAccountCompletion(false);
              setAcceptedTerms(false);
              clearFeedback();
            }}
            placeholder="você@email.com"
            value={email}
          />
          {email.trim() && !hasValidEmail ? (
            <Text accessibilityRole="alert" style={styles.authFieldErrorText}>
              Digite um e-mail válido, como nome@dominio.com.
            </Text>
          ) : null}

          <LabeledInput
            autoCapitalize="none"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            label="Senha"
            onChangeText={(value) => {
              setPassword(value);
              clearFeedback();
            }}
            onSubmitEditing={mode === "login" ? submitAuth : undefined}
            placeholder={
              mode === "login" ? "Sua senha" : "8 caracteres, letra maiúscula, minúscula e número"
            }
            returnKeyType={mode === "login" ? "done" : "next"}
            secureTextEntry
            value={password}
          />

          {mode === "create" ? (
            <>
              <View
                accessibilityLabel="Requisitos da senha"
                style={styles.authPasswordRequirements}
              >
                {passwordRequirements.map((requirement) => (
                  <View
                    key={requirement.id}
                    style={styles.authPasswordRequirement}
                  >
                    <View
                      style={[
                        styles.authPasswordRequirementIcon,
                        requirement.met
                          ? styles.authPasswordRequirementIconMet
                          : null
                      ]}
                    >
                      {requirement.met ? (
                        <Check
                          color={colors.onPrimary}
                          size={10}
                          strokeWidth={3}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.authPasswordRequirementText,
                        requirement.met
                          ? styles.authPasswordRequirementTextMet
                          : null
                      ]}
                    >
                      {requirement.label}
                    </Text>
                  </View>
                ))}
              </View>
              <LabeledInput
                autoCapitalize="none"
                autoComplete="new-password"
                label="Confirmar senha"
                onChangeText={(value) => {
                  setPasswordConfirmation(value);
                  clearFeedback();
                }}
                onSubmitEditing={submitAuth}
                placeholder="Repita sua senha"
                returnKeyType="done"
                secureTextEntry
                value={passwordConfirmation}
              />
              {passwordConfirmation &&
              password !== passwordConfirmation ? (
                <Text accessibilityRole="alert" style={styles.authFieldErrorText}>
                  As senhas não coincidem.
                </Text>
              ) : null}
            </>
          ) : null}

          {mode === "login" ? (
            <Pressable
              accessibilityRole="button"
              onPress={handlePasswordReset}
              style={styles.authInlineAction}
            >
              <Text style={styles.authInlineActionText}>Esqueci minha senha</Text>
            </Pressable>
          ) : null}

          {mustAcceptTerms ? (
            <Pressable
              accessibilityLabel="Aceitar Termos de Uso e Política de Privacidade"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              onPress={() => setAcceptedTerms((current) => !current)}
              style={styles.checkRow}
            >
              <View
                style={[
                  styles.checkBox,
                  acceptedTerms ? styles.checkBoxActive : null
                ]}
              >
                {acceptedTerms ? (
                  <Check color={colors.onPrimary} size={16} strokeWidth={3} />
                ) : null}
              </View>
              <Text style={styles.checkText}>
                Aceito os Termos de Uso e a Política de Privacidade da Xolot.
              </Text>
            </Pressable>
          ) : null}

          {needsAccountCompletion ? (
            <Text style={styles.authHelperText}>
              Esta etapa recupera o cadastro sem alterar sua senha.
            </Text>
          ) : null}

          {successMessage ? (
            <Text accessibilityRole="alert" style={styles.authSuccessText}>
              {successMessage}
            </Text>
          ) : null}

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.authErrorText}>
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={submitAuth}
            style={[
              styles.primaryButton,
              !canContinue ? styles.primaryButtonDisabled : null
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <SubmitIcon color={colors.onPrimary} size={19} strokeWidth={2.3} />
            )}
            <Text style={styles.primaryButtonText}>{submitLabel}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode(mode === "login" ? "create" : "login")}
            style={styles.secondaryButton}
          >
            {mode === "login" ? (
              <UserPlus color={colors.primary} size={18} />
            ) : (
              <LogIn color={colors.primary} size={18} />
            )}
            <Text style={styles.secondaryButtonText}>
              {mode === "login" ? "Cadastrar" : "Voltar para login"}
            </Text>
          </Pressable>
        </ScreenTransition>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}