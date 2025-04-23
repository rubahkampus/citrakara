// src/components/ProfileActions.tsx
'use client';

import { Stack } from '@mui/material';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import { KButton } from './KButton';

export default function ProfileActions() {
  const { open } = useUserDialogStore();

  return (
    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
      <KButton onClick={() => open('editProfile')}>Edit Profile</KButton>
      <KButton variantType="secondary">Upload Art</KButton>
      <KButton>Create Commission</KButton>
    </Stack>
  );
}