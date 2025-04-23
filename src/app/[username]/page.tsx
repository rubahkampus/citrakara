// src/app/[username]/page.tsx
import { getUserPublicProfile } from "@/lib/services/user.service";
import {
  getAuthSession,
  isUserOwner,
  serializeProfile,
  Session,
} from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ProfileContent from "@/components/ProfileContent";

interface ProfilePageProps {
  params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Await the params object before accessing properties
  const { username } = await params;

  const session = (await getAuthSession()) as Session | null;
  const rawProfile = await getUserPublicProfile(params.username);
  const profile = serializeProfile(rawProfile);

  if (!profile) return notFound();
  
  const isOwner = isUserOwner(session, username);

  return <ProfileContent profile={profile} isOwner={isOwner} />;
}
