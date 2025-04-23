// src/components/GlobalNavbar.tsx
import { getAuthSession } from "@/lib/utils/session";
import GlobalNavbarClient from "./GlobalNavbarClient";

export default async function Navbar() {
  const session = await getAuthSession();

  return <GlobalNavbarClient session={session} />;
}