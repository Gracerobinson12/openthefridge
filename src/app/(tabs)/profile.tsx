import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Avatar, Button, Glass, Input, Label, Photo, Row, T } from '../../components/ui';
import { confirm, notify } from '../../lib/dialog';
import { useApp, useData } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function Profile() {
  const { api, me, refreshMe } = useApp();
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
      await api.updateProfile({ avatar_url: res.assets[0].uri });
      await refreshMe();
    } catch (e) {
      notify('Couldn’t update photo', (e as Error).message);
    }
  }
  async function signOut() {
    const msg = api.mode === 'demo' ? 'In demo mode this resets the sample data on this device.' : 'You can sign back in any time.';
    if (await confirm('Sign out?', msg, api.mode === 'demo' ? 'Reset' : 'Sign out')) await api.signOut();
  }

  async function deleteAccount() {
    if (!(await confirm('Delete your account?', 'This permanently deletes your profile, recipes, comments and groups you own. It can’t be undone.', 'Delete'))) return;
    try {
      await api.deleteAccount();
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
        <Row>
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
        <Row last>
          <T size={14} color={colors.ink2} style={{ flex: 1 }}>Share my TikTok videos</T>
          <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.tintSoft, justifyContent: 'center' }}>
            <T w="bold" size={11}>COMING SOON</T>
          </View>
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

      <Button title={api.mode === 'demo' ? 'Reset demo data' : 'Sign out'} variant="ghost" onPress={signOut} />
      {api.mode === 'live' ? <Button title="Delete my account" variant="ghost" onPress={deleteAccount} /> : null}
    </Screen>
  );
}
