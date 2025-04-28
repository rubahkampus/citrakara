// src/components/Dialogs.tsx
'use client';

import { useAuthStore } from '@/lib/stores';
import AuthDialog from './auth/AuthDialog';

export default function Dialogs() {
  const { dialog, close } = useAuthStore();

  return (
    <>
      <AuthDialog
        open={dialog === 'login' || dialog === 'register'}
        onClose={close}
      />
    </>
  );
}