// src/app/[username]/page.tsx
import { getUserPublicProfile } from "@/lib/services/user.service";
import { getAuthSession } from "@/lib/utils/session";
import { notFound } from "next/navigation";
import ProfileContent from "@/components/ProfileContent";

interface ProfilePageProps {
  params: { username: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Await the params object before accessing properties
  const { username } = await params;
  
  const session = await getAuthSession();
  const rawProfile = await getUserPublicProfile(username);
  const profile = JSON.parse(JSON.stringify(rawProfile));


  if (!profile) return notFound();

  const isOwner = !!(
    session &&
    typeof session === "object" &&
    "username" in session &&
    session.username === username
  );

  return (
    <ProfileContent profile={profile} isOwner={isOwner} />
  );
}