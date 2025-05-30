// src/app/(dashboard)/[username]/contracts/layout.tsx
import { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import {
  getAuthSession,
  isUserOwner,
  Session,
} from "../../../../lib/utils/session";

export default async function ContractsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { username: string };
}) {
  const param = await params;
  const username = param.username;
  const session = await getAuthSession();
  const isAuthorized = session && isUserOwner(session as Session, username);

  // Only process expired uploads if the user is authorized
  // if (isAuthorized) {
  //   try {
  //     // Process any expired milestone uploads
  //     const result = await processExpiredMilestoneUploads();

  //     if (result.processed.length > 0) {
  //       console.log(
  //         `Auto-accepted ${result.processed.length} expired milestone uploads`
  //       );
  //     }

  //     if (result.errors.length > 0) {
  //       console.error(
  //         `Failed to process ${result.errors.length} expired milestone uploads`
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error processing expired milestone uploads:", error);
  //   }
  // }

  return (
    <Box>
      {children}
    </Box>
  );
}
