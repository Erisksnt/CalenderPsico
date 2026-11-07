'use client';

import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/site-settings-types';
import { SiteSettingsSchema } from '@/lib/validators';
import SitePage from '@/components/public/SitePage';

export default function SitePreviewClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (
        typeof event.data !== 'object' ||
        event.data === null ||
        event.data.type !== 'calenderpsico:preview-settings'
      ) {
        return;
      }
      const parsed = SiteSettingsSchema.safeParse(event.data.settings);
      if (parsed.success) setSettings(parsed.data);
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'calenderpsico:preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return <SitePage settings={settings} />;
}
