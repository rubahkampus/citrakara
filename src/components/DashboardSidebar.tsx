// src/components/DashboardSidebar.tsx 
'use client';

import Link from 'next/link';
import { Avatar, Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';

interface Props { username: string }

const links = [
  { label: 'Profil',       href: (u: string) => `/${u}/dashboard` },
  { label: 'Chat',         href: (u: string) => `/${u}/dashboard/chat` },
  { label: 'Komisi',       href: (u: string) => `/${u}/dashboard/commissions` },
  { label: 'Galeri',       href: (u: string) => `/${u}/dashboard/galleries` },
  { label: 'Proposal',     href: (u: string) => `/${u}/dashboard/proposals` },
  { label: 'Kontrak',      href: (u: string) => `/${u}/dashboard/contracts` },
  { label: 'Resolution',   href: (u: string) => `/${u}/dashboard/resolution` },
];

export default function DashboardSidebar({ username }: Props) {
  const pathname = usePathname();

  return (
    <Box sx={{ width: 240 }}>
      {/* header card – avatar + name */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          textAlign: 'center',
          mb: 2,
        }}
      >
        <Avatar
          src="/default-profile.png"
          sx={{ width: 72, height: 72, mx: 'auto', mb: 1 }}
        />
        <Typography fontWeight="bold">{username}</Typography>
      </Box>

      {/* nav list */}
      <List disablePadding>
        {links.map(link => {
          const href   = link.href(username);
          const active = pathname === href;
          return (
            <Link key={href} href={href} passHref>
              <ListItemButton selected={active}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </Link>
          );
        })}
      </List>
    </Box>
  );
}
