import { Alert, Platform } from 'react-native';

/** Simple alert that also works on the web build. */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

/** Yes/no question that also works on the web build. */
export function confirm(title: string, message: string, okLabel = 'OK'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: okLabel, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** Pick one of several actions (used for the recipe "…" menu). */
export function choose(title: string, options: string[]): Promise<number> {
  if (Platform.OS === 'web') {
    const answer = window.prompt(`${title}\n\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nType a number:`);
    const n = Number(answer) - 1;
    return Promise.resolve(Number.isInteger(n) && n >= 0 && n < options.length ? n : -1);
  }
  return new Promise((resolve) =>
    Alert.alert(title, undefined, [
      ...options.map((o, i) => ({ text: o, onPress: () => resolve(i) })),
      { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(-1) },
    ]),
  );
}
