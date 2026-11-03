import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * PWA install support for the website.
 * `public/index.html` catches the browser's install prompt early (before React loads)
 * and stores it on `window.__otfPrompt`; this hook reads it.
 */
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type W = Window & { __otfPrompt?: PromptEvent | null };

export type InstallState = {
  /** Already running as an installed app (home-screen icon). */
  installed: boolean;
  /** iPhone/iPad: no install prompt exists, people use Share → Add to Home Screen. */
  ios: boolean;
  /** Android/desktop Chrome/Edge: we can show the real install dialog. */
  canPrompt: boolean;
  /** Shows the install dialog. Resolves true if they installed. */
  install: () => Promise<boolean>;
};

export function useInstall(): InstallState {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const w = window as W;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setInstalled(!!standalone);
    const ua = navigator.userAgent;
    setIos(/iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document));
    const sync = () => setCanPrompt(!!w.__otfPrompt);
    const done = () => { setInstalled(true); setCanPrompt(false); };
    sync();
    window.addEventListener('otf-installable', sync);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('otf-installable', sync);
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  return {
    installed,
    ios,
    canPrompt,
    install: async () => {
      const w = window as W;
      const p = w.__otfPrompt;
      if (!p) return false;
      await p.prompt();
      const { outcome } = await p.userChoice;
      w.__otfPrompt = null;
      setCanPrompt(false);
      if (outcome === 'accepted') setInstalled(true);
      return outcome === 'accepted';
    },
  };
}
