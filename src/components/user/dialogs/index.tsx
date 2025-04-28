// src/components/dialogs/index.tsx
'use client';

import { useUserStore, useProfileStore, useGalleryStore } from '@/lib/stores';
import ProfileDialog from './ProfileDialog.jsx';
import UploadDialog from './UploadDialog.jsx';
import CommissionDialog from './CommissionDialog.jsx';
import GalleryPostDialog from './GalleryPostDialog.jsx';

interface DialogsProps {
  profile?: any;
  isOwner?: boolean;
}

export default function Dialogs({ profile, isOwner = false }: DialogsProps) {
  const { dialog: userDialog, close: closeUserDialog } = useUserStore();
  const { commissionDialogOpen, galleryDialogOpen, closeCommissionDialog, closeGalleryDialog } = useProfileStore();
  const { isOpen: galleryPostOpen, close: closeGalleryPost } = useGalleryStore();

  // Return early patterns
  if (!profile && isOwner) return null;

  return (
    <>
      {/* User dialogs - only for profile owners */}
      {isOwner && (
        <>
          <ProfileDialog
            open={userDialog === 'editProfile'}
            onClose={closeUserDialog}
            profile={profile}
            onUpdateSuccess={(updated) => {
              console.log("Profile updated!", updated);
            }}
          />
          
          <UploadDialog />
        </>
      )}
      
      {/* Public dialogs - visible to everyone */}
      <CommissionDialog 
        isOpen={commissionDialogOpen} 
        onClose={closeCommissionDialog} 
        isOwner={isOwner}
      />
      
      <GalleryPostDialog 
        isOpen={galleryPostOpen || galleryDialogOpen}
        onClose={galleryPostOpen ? closeGalleryPost : closeGalleryDialog}
      />
    </>
  );
}