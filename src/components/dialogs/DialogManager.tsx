// src/components/dialogs/DialogManager.tsx - Central dialog handler
"use client";

import { useDialogStore } from "@/lib/stores";
import dynamic from "next/dynamic";

// Dynamically import all dialogs to reduce initial bundle size
const AuthDialog = dynamic(() => import("./AuthDialog"));
const ProfileDialog = dynamic(() => import("./ProfileDialog"));
const UploadArtDialog = dynamic(() => import("./UploadArtDialog"));
const CommissionDialog = dynamic(() => import("./CommissionDialog"));
const GalleryPostDialog = dynamic(() => import("./GalleryPostDialog"));
const TosDialog = dynamic(() => import("./TosDialog")); // Now uncommented

export default function DialogManager() {
  const { dialog, close } = useDialogStore();

  if (!dialog) return null;

  const { type, entityId, data, isOwner } = dialog;

  // Auth dialogs
  if (type === "login" || type === "register") {
    return <AuthDialog open={true} onClose={close} initialMode={type} />;
  }

  // Profile dialogs
  if (type === "editProfile") {
    return <ProfileDialog open={true} onClose={close} profile={data} />;
  }

  if (type === "uploadArtwork") {
    return (
      <UploadArtDialog
        open={true}
        onClose={close}
        initialGalleryId={entityId}
      />
    );
  }

  // Commission dialogs
  if (type === "viewCommission") {
    return (
      <CommissionDialog
        open={true}
        onClose={close}
        commissionId={entityId}
        mode={"view"}
        isOwner={isOwner || false}
        initialData={data}
      />
    );
  }

  // Gallery dialogs
  if (type === "viewGalleryPost" || type === "editGalleryPost") {
    return (
      <GalleryPostDialog
        open={true}
        onClose={close}
        postId={entityId}
        mode={type === "editGalleryPost" ? "edit" : "view"}
        isOwner={isOwner || false}
      />
    );
  }

  // TOS dialogs
  if (type === "viewTos" || type === "editTos" || type === "createTos") {
    return (
      <TosDialog
        open={true}
        onClose={close}
        tosId={entityId}
        mode={
          type === "createTos" ? "create" : type === "editTos" ? "edit" : "view"
        }
        isOwner={isOwner} // Make sure this prop is passed correctly
      />
    );
  }

  return null;
}
