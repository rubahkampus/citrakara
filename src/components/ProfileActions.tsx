// srqc/components/ProfileActions.tsx
"use client";

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import EditProfileDialog from "@/components/ProfileDialog";
import { useRouter } from "next/navigation";

export default function ProfileActions({ profile }: { profile: any }) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => setEditOpen(true)}>Edit Profile</Button>
        <Button variant="contained" color="secondary">Upload Art</Button>
        <Button variant="contained">Create Commission</Button>
      </Stack>

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onUpdateSuccess={() => router.refresh()}
      />
    </>
  );
}
