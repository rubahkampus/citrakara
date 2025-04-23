// ─── src/components/DashboardProfile.tsx ──────────────────────────────────────
'use client';

import { Box, Paper, Typography, Stack } from '@mui/material';
import { KButton } from './KButton';
import { useUserDialogStore } from '@/lib/stores/userDialogStore';

interface Props {
  profile: any;
  saldo:   number;   // cents / IDR – format as you like
  tosSummary: string;
}

export default function DashboardProfile({ profile, saldo, tosSummary }: Props) {
  const { open } = useUserDialogStore();

  return (
    <Box sx={{ flex: 1 }}>
      {/* profile card */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <img
            src={`${profile.profilePicture}?t=${Date.now()}`}
            width={80}
            height={80}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {profile.displayName ?? profile.username}
            </Typography>
            <Typography color="text.secondary">{profile.email}</Typography>
          </Box>
        </Stack>

        {/* saldo + TOS */}
        <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Saldo KOMIS
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              Rp{saldo.toLocaleString('id-ID')}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              TOS Maker
            </Typography>
            <Typography variant="body2">
              {tosSummary}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mt: 4 }}>
          <KButton onClick={() => open('editProfile')}>Edit Profil</KButton>
        </Box>
      </Paper>
    </Box>
  );
}
