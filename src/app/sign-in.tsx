import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button, Glass, Input, T } from '../components/ui';
import { notify } from '../lib/dialog';
import { useApp } from '../lib/store';
import { colors } from '../lib/theme';

export default function SignIn() {
  const { api, refreshMe } = useApp();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 6) return notify('Check your details', 'Enter your email and a password of at least 6 characters.');
    if (mode === 'up' && !/^[a-z0-9._]{3,24}$/i.test(username)) return notify('Pick a username', '3–24 letters, numbers, dots or underscores.');
    setBusy(true);
    try {
      if (mode === 'in') await api.signIn(email.trim(), password);
      else {
        const { needsConfirm } = await api.signUp(email.trim(), password, username.trim(), name.trim());
        if (needsConfirm) notify('Check your email', 'Tap the link we sent to confirm your account, then sign in.');
      }
      await refreshMe();
    } catch (e) {
      notify(mode === 'in' ? 'Couldn’t sign in' : 'Couldn’t sign up', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen glow="pink" bottomSpace={40}>
        <View style={{ marginTop: 60, gap: 6 }}>
          <T w="heavy" size={40} accessibilityRole="header">Open the Fridge</T>
          <T size={16} color={colors.ink2}>Your recipes, your people, one fridge door.</T>
        </View>
        <Glass radius={26} strong style={{ padding: 16, gap: 10, marginTop: 20 }}>
          {mode === 'up' ? (
            <>
              <Input value={name} onChangeText={setName} placeholder="Your name" accessibilityLabel="Your name" autoComplete="name" />
              <Input value={username} onChangeText={setUsername} placeholder="Username" accessibilityLabel="Username" autoCapitalize="none" autoComplete="username-new" />
            </>
          ) : null}
          <Input value={email} onChangeText={setEmail} placeholder="Email" accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Input value={password} onChangeText={setPassword} placeholder="Password" accessibilityLabel="Password" secureTextEntry autoComplete={mode === 'up' ? 'new-password' : 'current-password'} onSubmitEditing={submit} />
          <Button title={mode === 'in' ? 'Sign in' : 'Create account'} onPress={submit} busy={busy} />
        </Glass>
        <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')} style={{ alignItems: 'center', padding: 8 }} accessibilityRole="button">
          <T w="semibold" size={14} color={colors.accent}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}</T>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}
