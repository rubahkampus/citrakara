// src/app/[username]/layout.tsx
import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getAuthSession, isUserOwner } from "@/lib/utils/session";
import { getUserPublicProfile } from "@/lib/services/user.service";

interface Props {
  children: ReactNode;
  params: { username: string };
}

export default async function ProfileLayout({
  children,
  params
}: Props) {
  const param = await params;
  const { username } = param;
  
  const session = await getAuthSession();
  const rawProfile = await getUserPublicProfile(username);
  if (!rawProfile) notFound();

  // We leave routing decisions (dashboard, etc.) to child pages
  return <>{children}</>;
}
