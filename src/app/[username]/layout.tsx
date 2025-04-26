// src/app/[username]/layout.tsx
import type { ReactNode } from 'react';
import UserDialogs from '@/components/UserDialogs';
import { getUserPublicProfile } from '@/lib/services/user.service';
import { getAuthSession, isUserOwner, serializeProfile, Session } from '@/lib/utils/session';
import GalleryPostDialog from '@/components/profile/dialogs/GalleryPostDialog';

interface LayoutProps {
  children: ReactNode;
  params: { username: string };
}

export default async function UserLayout({ children, params }: LayoutProps) {
  // Await the params object before accessing properties
  const { username } = await params;

  const session = await getAuthSession() as Session | null;
  const rawProfile = await getUserPublicProfile(username);
  const profile = serializeProfile(rawProfile);
  const isOwner = isUserOwner(session, username);

  return (
    <>
      {children}
      <UserDialogs profile={profile} isOwner={isOwner} />
      <GalleryPostDialog />
    </>
  );
}