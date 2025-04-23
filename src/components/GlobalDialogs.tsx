// src/components/GlobalDialogs.tsx
'use client';

import { useAuthDialogStore } from '@/lib/stores/authDialogStore';
import GlobalAuthDialog from './GlobalAuthDialog';

export default function GlobalDialogs() {
  const { openDialog, close } = useAuthDialogStore();

  return (
    <>
      <GlobalAuthDialog
        open={openDialog === 'login' || openDialog === 'register'}
        onClose={close}
      />
    </>
  );
}
