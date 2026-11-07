import BookingPage from '@/components/public/BookingPage';
import PublicShell from '@/components/public/PublicShell';
import { getPublishedSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function SchedulePublicPage() {
  const settings = await getPublishedSiteSettings();
  return (
    <PublicShell settings={settings}>
      <div className="container mx-auto px-4 py-10">
        <BookingPage />
      </div>
    </PublicShell>
  );
}
