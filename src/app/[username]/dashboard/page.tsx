// src/app/[username]/dashboard/page.tsx
import { getUserPublicProfile } from '@/lib/services/user.service';
import DashboardProfile from '@/components/DashboardProfile';

export default async function DashboardPage({ params }: { params: { username: string } }) {
  const profile = await getUserPublicProfile(params.username);

  const saldo = 0;
  const tosSummary = profile.tos ?? 'Belum membuat TOS.';

  return (
    <DashboardProfile
      profile={profile}
      saldo={saldo}
      tosSummary={tosSummary}
    />
  );
}
