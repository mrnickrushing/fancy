import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { Logo } from '../src/components/Logo';
import { NoticeBanner } from '../src/components/NoticeBanner';
import { errorMessage } from '../src/api/client';
import { useAuthStore } from '../src/store/auth';
import { colors, fonts, fontSize, spacing } from '../src/theme';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const authNotice = useAuthStore((s) => s.authNotice);
  const clearNotice = useAuthStore((s) => s.clearNotice);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    clearNotice();
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(errorMessage(err, 'That username and password did not work.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Logo size={92} showWordmark={false} />
          <Text style={styles.script}>Oh! You Fancy</Text>
          <Text style={styles.caps}>Focaccia</Text>
        </View>

        <Card>
          <Text style={styles.eyebrow}>The Order Book</Text>
          <Text style={styles.title}>Sign in</Text>

          {authNotice ? <NoticeBanner tone="info" message={authNotice} /> : null}
          {error ? <NoticeBanner tone="error" message={error} /> : null}

          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <Button label="Sign in" onPress={submit} loading={loading} />
        </Card>

        <Text style={styles.footnote}>
          The same username and password as the admin page on the website.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.s6, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.s8 },
  script: { fontFamily: fonts.script, fontSize: 54, color: colors.primary, lineHeight: 60, marginTop: spacing.s3 },
  caps: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    letterSpacing: 7,
    textTransform: 'uppercase',
    color: colors.text,
    marginTop: -4,
  },
  eyebrow: {
    fontFamily: fonts.displaySemibold,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.olive,
  },
  title: {
    fontFamily: fonts.displaySemibold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginTop: spacing.s1,
    marginBottom: spacing.s5,
  },
  footnote: {
    fontFamily: fonts.bodyRegular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s6,
  },
});
