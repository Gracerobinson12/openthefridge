import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button, Glass, IconButton, Input, T } from '../components/ui';
import { Icon } from '../components/Icon';
import { notify } from '../lib/dialog';
import { hasBlockedWord, KIND_MESSAGE } from '../lib/filter';
import { LEGAL } from '../lib/legal';
import { useApp } from '../lib/store';
import { colors } from '../lib/theme';

export default function SignIn() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { api, refreshMe } = useApp();
  const [mode, setMode] = useState<'in' | 'up'>(params.mode === 'up' ? 'up' : 'in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const up = mode === 'up';

  async function submit() {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return notify('Check your email', 'Enter a valid email address.');
    if (password.length < 8) return notify('Password too short', 'Use at least 8 characters.');
    if (up && !name.trim()) return notify('Add your name', 'This is what people see on your recipes.');
    if (up && !/^[a-z0-9._]{3,24}$/i.test(username.trim())) return notify('Pick a username', '3–24 letters, numbers, dots or underscores. No spaces.');
    if (up && hasBlockedWord(name, username.replace(/[._]/g, ' '))) return notify('Let’s keep it kind', KIND_MESSAGE);
    if (up && !agreed) return notify('One more thing', `Please confirm you're ${LEGAL.minAge} or older and agree to the Terms, Privacy Policy and Community Guidelines.`);
    setBusy(true);
    try {
      if (up) {
        if (!(await api.usernameAvailable(username.trim()))) {
          notify('Username taken', `@${username.trim().toLowerCase()} is already taken. Try another.`);
          return;
        }
        const { needsConfirm } = await api.signUp(e, password, username.trim().toLowerCase(), name.trim());
        if (needsConfirm) {
          setSent(e);
          return;
        }
      } else {
        await api.signIn(e, password);
      }
      await refreshMe();
      router.replace('/');
    } catch (err) {
      const msg = (err as Error).message;
      notify(up ? 'Couldn’t create account' : 'Couldn’t log in', /invalid login/i.test(msg) ? 'Wrong email or password.' : msg);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return notify('Enter your email first', 'Type the email you signed up with, then tap “Forgot password?” again.');
    try {
      await api.resetPassword(e);
      notify('Check your email', `We sent a link to ${e} to reset your password.`);
    } catch (err) {
      notify('Couldn’t send reset email', (err as Error).message);
    }
  }

  if (sent) {
    return (
      <Screen glow="pink" bottomSpace={40}>
        <View style={{ marginTop: 80, gap: 10 }}>
          <T w="heavy" size={32} accessibilityRole="header">Check your email</T>
          <T size={16} color={colors.ink2} style={{ lineHeight: 23 }}>
            We sent a confirmation link to <T w="bold" size={16}>{sent}</T>. Tap it to finish creating your account, then come back and log in.
          </T>
        </View>
        <Button title="Go to log in" onPress={() => { setSent(null); setMode('in'); }} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen glow="pink" bottomSpace={40}>
        <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />
        <View style={{ gap: 6, marginTop: 8 }}>
          <T w="heavy" size={34} accessibilityRole="header">{up ? 'Create your account' : 'Welcome back'}</T>
          <T size={16} color={colors.ink2}>{up ? 'Takes 30 seconds. Then open the fridge.' : 'Log in to open the fridge.'}</T>
        </View>

        <Glass radius={26} strong style={{ padding: 16, gap: 10 }}>
          {up ? (
            <>
              <Input value={name} onChangeText={setName} placeholder="Your name" accessibilityLabel="Your name" autoComplete="name" textContentType="name" maxLength={50} />
              <View>
                <Input value={username} onChangeText={(v) => setUsername(v.replace(/\s/g, ''))} placeholder="username" accessibilityLabel="Username" autoCapitalize="none" autoCorrect={false} autoComplete="username-new" textContentType="username" maxLength={24} style={{ paddingLeft: 30 }} />
                <T size={15} color={colors.ink3} style={{ position: 'absolute', left: 14, top: 14 }}>@</T>
              </View>
            </>
          ) : null}
          <Input value={email} onChangeText={setEmail} placeholder="Email" accessibilityLabel="Email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <View>
            <Input value={password} onChangeText={setPassword} placeholder={up ? 'Password (8+ characters)' : 'Password'} accessibilityLabel="Password" secureTextEntry={!showPw}
              autoComplete={up ? 'new-password' : 'current-password'} textContentType={up ? 'newPassword' : 'password'} onSubmitEditing={submit} style={{ paddingRight: 64 }} />
            <Pressable onPress={() => setShowPw(!showPw)} accessibilityRole="button" accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 6, top: 6, height: 36, paddingHorizontal: 10, justifyContent: 'center' }}>
              <T w="semibold" size={13} color={colors.accent}>{showPw ? 'Hide' : 'Show'}</T>
            </Pressable>
          </View>
          {up ? (
            <Pressable onPress={() => setAgreed(!agreed)} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}
              style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4, paddingHorizontal: 2 }}>
              <View style={{ width: 22, height: 22, marginTop: 1, borderRadius: 7, borderWidth: agreed ? 0 : 1.5, borderColor: 'rgba(20,17,26,0.35)', backgroundColor: agreed ? colors.ink : colors.white, alignItems: 'center', justifyContent: 'center' }}>
                {agreed ? <Icon name="check" size={14} color={colors.white} strokeWidth={3.2} /> : null}
              </View>
              <T size={13} color={colors.ink2} style={{ flex: 1, lineHeight: 19 }}>
                I'm {LEGAL.minAge} or older and agree to the{' '}
                <T size={13} w="semibold" color={colors.accent} onPress={() => router.push('/terms')}>Terms</T>,{' '}
                <T size={13} w="semibold" color={colors.accent} onPress={() => router.push('/privacy')}>Privacy Policy</T> and{' '}
                <T size={13} w="semibold" color={colors.accent} onPress={() => router.push('/guidelines')}>Community Guidelines</T>.
                No tolerance for objectionable content or abusive users.
              </T>
            </Pressable>
          ) : null}
          <Button title={up ? 'Create account' : 'Log in'} onPress={submit} busy={busy} />
          {!up ? (
            <Pressable onPress={forgot} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 6 }}>
              <T w="semibold" size={13} color={colors.ink2}>Forgot password?</T>
            </Pressable>
          ) : null}
        </Glass>

        <Pressable onPress={() => setMode(up ? 'in' : 'up')} style={{ alignItems: 'center', padding: 8 }} accessibilityRole="button">
          <T w="semibold" size={14} color={colors.accent}>{up ? 'Already have an account? Log in' : 'New here? Create an account'}</T>
        </Pressable>
        {api.mode === 'demo' ? (
          <T size={12} color={colors.ink3} style={{ textAlign: 'center' }}>
            Test mode: accounts are saved only in this browser until the app is connected to Supabase.
          </T>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
