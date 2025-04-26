// src/components/UserDialogs.tsx
'use client';

import { useUserDialogStore } from '@/lib/stores/userDialogStore';
import EditUserProfileDialog from './profile/dialogs/UserEditProfileDialog';
import UploadArtDialog from './profile/dialogs/UploadArtDialog';

export default function UserDialogs({
  profile,
  isOwner,
}: {
  profile: any;
  isOwner: boolean;
}) {
  const { openDialog, close } = useUserDialogStore();

  // Prevent mounting dialogs if not the owner
  if (!isOwner) return null;

  return (
    <>
      <EditUserProfileDialog
        open={openDialog === 'editProfile'}
        onClose={close}
        profile={profile}
        onUpdateSuccess={(updated) => {
          console.log("Profile updated!", updated);
        }}
      />
      
      <UploadArtDialog />
    </>
  );
}