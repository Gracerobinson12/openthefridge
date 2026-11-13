import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Avatar, Button, Glass, Input, Label, Photo, Row, T } from '../../components/ui';
import { confirm, notify } from '../../lib/dialog';
import { hasBlockedWord, KIND_MESSAGE } from '../../lib/filter';
import { shrinkPhoto } from '../../lib/photos';
import { useApp, useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Profile() {
  const { api, me, refreshMe } = useApp();
  const params = useLocalSearchParams<{ reset?: string }>();
  const [pwOpen, setPwOpen] = useState(params.reset === '1');
  const [accountOpen, setAccountOpen] = useState(params.reset === '1');
  const [newPw, setNewPw] = useState('');
  const { data: stats } = useData((a) => a.stats(), []);
  const { data: mine } = useData((a) => a.tin('All'), []);
  const own = (mine ?? []).filter((r) => r.author_id === me?.id).slice(0, 6);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [tiktok, setTiktok] = useState('');

  useEffect(() => {
    setName(me?.display_name ?? '');
    setBio(me?.bio ?? '');
    setTiktok(me?.tiktok_handle ?? '');
  }, [me]);

  async function save() {
    if (hasBlockedWord(name, bio, tiktok)) return notify('Let’s keep it kind', KIND_MESSAGE);
    try {
      await api.updateProfile({ display_name: name.trim(), bio: bio.trim() || null, tiktok_handle: tiktok.replace(/^@/, '').trim() || null });
      await refreshMe();
      setEditing(false);
    } catch (e) {
      notify('Couldn’t save', (e as Error).message);
    }
  }
  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (res.canceled) return;
    try {
      const a = res.assets[0];
      await api.updateProfile({ avatar_url: await shrinkPhoto(a.uri, a.width, a.height, 512) });
      await refreshMe();
    } catch (e) {
      notify('Couldn’t update photo', (e as Error).message);
    }
  }
  async function signOut() {
    if (await confirm('Log out?', 'You can log back in any time.', 'Log out')) {
      await api.signOut();
      router.replace('/welcome');
    }
  }
  async function resetTestData() {
    if (await confirm('Reset test data?', 'Deletes the test accounts and sample recipes saved in this browser.', 'Reset')) {
      await api.deleteAccount();
      router.replace('/welcome');
    }
  }
  async function savePassword() {
    if (newPw.length < 8) return notify('Password too short', 'Use at least 8 characters.');
    try {
      await api.changePassword(newPw);
      setNewPw('');
      setPwOpen(false);
      notify('Password updated');
    } catch (e) {
      notify('Couldn’t update password', (e as Error).message);
    }
  }
  async function deleteAccount() {
    if (!(await confirm('Delete your account?', 'This permanently deletes your profile, recipes, comments and groups you own. It can’t be undone.', 'Delete'))) return;
    try {
      await api.deleteAccount();
      router.replace('/welcome');
    } catch (e) {
      notify('Couldn’t delete account', (e as Error).message);
    }
  }

  const display = me?.display_name || me?.username || 'You';
  return (
    <Screen glow="peach">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
        <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <Avatar name={display} uri={me?.avatar_url} size={84} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <T w="heavy" size={26} numberOfLines={1}>{display}</T>
          <T size={14} color={colors.ink2}>@{me?.username}{me?.bio ? ` · ${me.bio}` : ''}</T>
        </View>
      </View>

      <Glass radius={22} style={{ flexDirection: 'row', paddingVertical: 12 }}>
        {[['RECIPES', stats?.recipes], ['GROUPS', stats?.groups], ['FOLLOWERS', stats?.followers]].map(([label, n], i) => (
          <View key={label as string} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: colors.hairline }}>
            <T w="heavy" size={20}>{n ?? '–'}</T>
            <T w="semibold" size={11} color={colors.ink2} style={{ letterSpacing: 0.44 }}>{label as string}</T>
          </View>
        ))}
      </Glass>

      {editing ? (
        <Glass radius={22} style={{ padding: 14, gap: 10 }}>
          <Input value={name} onChangeText={setName} placeholder="Display name" accessibilityLabel="Display name" />
          <Input value={bio} onChangeText={setBio} placeholder="Short bio, e.g. home baker" accessibilityLabel="Bio" maxLength={80} />
          <Input value={tiktok} onChangeText={setTiktok} placeholder="TikTok handle (optional)" autoCapitalize="none" accessibilityLabel="TikTok handle" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="Cancel" variant="soft" style={{ flex: 1 }} onPress={() => setEditing(false)} />
            <Button title="Save" style={{ flex: 1 }} onPress={save} />
          </View>
        </Glass>
      ) : (
        <Button title="Edit profile" variant="soft" onPress={() => setEditing(true)} />
      )}

      <Label>TIKTOK</Label>
      <Glass radius={22}>
        <Row last>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="music" size={20} color={colors.white} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <T w="bold" size={15}>Photo slides</T>
            <T size={12} color={colors.ink2}>{me?.tiktok_handle ? `@${me.tiktok_handle}` : 'Add your handle in Edit profile'}</T>
          </View>
          {me?.tiktok_handle ? (
            <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.tintSoft, justifyContent: 'center' }}>
              <T w="bold" size={11}>READY</T>
            </View>
          ) : null}
        </Row>
      </Glass>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <T w="heavy" size={20}>My recipes</T>
        <Pressable onPress={() => router.navigate('/tin')}><T w="semibold" size={14} color={colors.accent}>See all</T></Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {own.map((r) => (
          <Pressable key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} style={{ width: '31.5%' }} accessibilityRole="link">
            <Glass radius={20} style={{ padding: 6, gap: 6 }}>
              <Photo uri={r.photos[0]} category={r.category} height={86} radius={15} />
              <T w="bold" size={13} numberOfLines={1} style={{ paddingHorizontal: 4, paddingBottom: 4 }}>{r.title}</T>
            </Glass>
          </Pressable>
        ))}
      </View>
      {own.length === 0 ? <T size={14} color={colors.ink2}>You haven’t added a recipe yet.</T> : null}

      <Pressable onPress={() => setAccountOpen(!accountOpen)} accessibilityRole="button" accessibilityState={{ expanded: accountOpen }}>
        <Glass radius={22} style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="settings" size={20} />
          <T w="bold" size={15} style={{ flex: 1 }}>Account</T>
          <View style={{ transform: [{ rotate: accountOpen ? '90deg' : '0deg' }] }}>
            <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={2.2} />
          </View>
        </Glass>
      </Pressable>
      {accountOpen ? (
        <>
        {pwOpen ? (
          <Glass radius={22} style={{ padding: 14, gap: 10 }}>
            <Input value={newPw} onChangeText={setNewPw} placeholder="New password (8+ characters)" secureTextEntry accessibilityLabel="New password" autoComplete="new-password" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Cancel" variant="soft" style={{ flex: 1 }} onPress={() => setPwOpen(false)} />
              <Button title="Save password" style={{ flex: 1 }} onPress={savePassword} />
            </View>
          </Glass>
        ) : null}
        <Glass radius={22}>
          {!pwOpen ? <Row onPress={() => setPwOpen(true)}><T w="semibold" size={15}>Change password</T></Row> : null}
          {me?.is_admin ? <Row onPress={() => router.push('/admin')}><T w="semibold" size={15} color={colors.accent}>Moderation</T></Row> : null}
          <Row onPress={() => router.push('/support')}><T w="semibold" size={15}>Help & Support</T></Row>
          <Row onPress={() => router.push('/legal')}><T w="semibold" size={15}>Terms & Privacy</T></Row>
          <Row onPress={signOut}><T w="semibold" size={15}>Log out</T></Row>
          {api.mode === 'demo' ? <Row onPress={resetTestData}><T w="semibold" size={15} color={colors.ink2}>Reset test data</T></Row> : null}
          <Row last onPress={api.mode === 'demo' ? resetTestData : deleteAccount}><T w="semibold" size={15} color={colors.heart}>Delete my account</T></Row>
        </Glass>
        </>
      ) : null}
    </Screen>
  );
}
