import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Button, Empty, Glass, Input, Label, Loading, Row, T } from '../../components/ui';
import { notify } from '../../lib/dialog';
import { hasBlockedWord, KIND_MESSAGE } from '../../lib/filter';
import { useApp, useData } from '../../lib/store';
import { colors, GROUP_COLORS } from '../../lib/theme';

export default function Groups() {
  const { api, changed } = useApp();
  const { data, loading } = useData((a) => a.groups(), []);
  const [name, setName] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[1]);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);

  async function create() {
    if (!name.trim()) return;
    if (hasBlockedWord(name)) return notify('Let’s keep it kind', KIND_MESSAGE);
    setBusy('create');
    try {
      const id = await api.createGroup(name.trim(), color);
      setName('');
      changed();
      router.push(`/group/${id}`);
    } catch (e) {
      notify('Couldn’t create group', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function join() {
    if (!code.trim()) return;
    setBusy('join');
    try {
      const id = await api.joinGroup(code);
      setCode('');
      changed();
      router.push(`/group/${id}`);
    } catch (e) {
      notify('Couldn’t join', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen glow="violet">
      <View style={{ gap: 4 }}>
        <T w="heavy" size={34} accessibilityRole="header">Groups</T>
        <T size={15} color={colors.ink2}>Private recipe boxes for your people</T>
      </View>

      {loading && !data ? <Loading /> : null}
      {data?.length === 0 ? <Empty title="No groups yet" body="Start one for your family or friends, or join with an invite code." /> : null}
      {data?.length ? (
        <Glass radius={22}>
          {data.map((g, i) => (
            <Row key={g.id} last={i === data.length - 1} onPress={() => router.push(`/group/${g.id}`)} style={{ minHeight: 64 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: g.color, borderWidth: 1, borderColor: colors.glassBorder }} />
              <View style={{ flex: 1 }}>
                <T w="bold" size={15}>{g.name}</T>
                <T size={12} color={colors.ink2}>{g.member_count} {g.member_count === 1 ? 'member' : 'members'} · code {g.invite_code}</T>
              </View>
              <Icon name="chevron" size={16} color={colors.ink3} strokeWidth={2.2} />
            </Row>
          ))}
        </Glass>
      ) : null}

      <Label>START A GROUP</Label>
      <Glass radius={22} style={{ padding: 14, gap: 12 }}>
        <Input value={name} onChangeText={setName} placeholder="Group name, e.g. Sunday Brunch Club" accessibilityLabel="Group name" maxLength={60} />
        <View style={{ flexDirection: 'row', gap: 10 }} accessibilityRole="radiogroup">
          {GROUP_COLORS.map((c) => (
            <Pressable key={c} accessibilityRole="radio" accessibilityState={{ checked: color === c }} accessibilityLabel={`Color ${c}`} onPress={() => setColor(c)}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: color === c ? 2.5 : 1, borderColor: color === c ? colors.ink : colors.glassBorder }} />
          ))}
        </View>
        <Button title="Create group" onPress={create} busy={busy === 'create'} disabled={!name.trim()} />
      </Glass>

      <Label>JOIN WITH A CODE</Label>
      <Glass radius={22} style={{ padding: 14, flexDirection: 'row', gap: 10 }}>
        <Input value={code} onChangeText={setCode} placeholder="Invite code" autoCapitalize="characters" accessibilityLabel="Invite code" style={{ flex: 1 }} />
        <Button title="Join" variant="soft" onPress={join} busy={busy === 'join'} style={{ height: 48 }} />
      </Glass>
    </Screen>
  );
}
