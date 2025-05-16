// src/app/[username]/page.tsx
import { notFound } from "next/navigation";
import ProfileContent from "@/components/profile/ProfileContent";
import {
  getAuthSession,
  isUserOwner,
  serializeProfile,
  Session,
} from "@/lib/utils/session";
import {
  getUserBookmarkedArtists,
  getUserBookmarkedCommissions,
  getUserPublicProfile,
} from "@/lib/services/user.service";

interface Props {
  params: { username: string };
}

export default async function ProfilePage({ params }: Props) {
  const param = await params;
  const { username } = param;

  const [rawSession, rawProfile] = await Promise.all([
    getAuthSession(),
    getUserPublicProfile(username),
  ]);
  const session =
    typeof rawSession === "object" &&
    rawSession !== null &&
    "username" in rawSession
      ? (rawSession as Session | null)
      : null;
  const profile = serializeProfile(rawProfile);

  const bookmarkedArtist = getUserBookmarkedArtists((session as Session).id);

  const bookmarkedCommission = getUserBookmarkedCommissions(
    (session as Session).id
  );

  if (!profile) return notFound();

  const isOwner = isUserOwner(session, username);
  return (
    <ProfileContent
      profile={profile}
      isOwner={isOwner}
      session={session as Session}
    />
  );
}
