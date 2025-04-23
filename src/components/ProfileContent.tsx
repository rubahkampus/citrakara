// src/components/ProfileContent.tsx
import { Box, Typography, Avatar, Stack } from "@mui/material";
import ProfileActions from "@/components/ProfileActions"; // ⬅️ client component

interface ProfileContentProps {
  profile: any;
  isOwner: boolean;
}

export default function ProfileContent({ profile, isOwner }: ProfileContentProps) {
  return (
    <>
      {/* Banner */}
      <Box
        sx={{
          width: "100%",
          height: 200,
          backgroundImage: `url(${profile.banner || "/default-banner.jpg"}?t=${Date.now()})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 2,
        }}
      />
      
      {/* Info */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: -6, ml: 3 }}>
        <Avatar
          src={`${profile.profilePicture || "/default-profile.png"}?t=${Date.now()}`}
          sx={{ width: 100, height: 100, border: "4px solid white" }}
        />
        <Box>
          <Typography variant="h5" fontWeight="bold">{profile.username}</Typography>
          <Typography color="text.secondary">{profile.bio || "No bio yet."}</Typography>
        </Box>
      </Stack>

      {/* Actions */}
      {isOwner && <ProfileActions />}

      {/* Portfolio */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold">Portfolio</Typography>
        <Typography color="text.secondary">(Artwork will be displayed here)</Typography>
      </Box>

      {/* Commissions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold">Commission Listings</Typography>
        <Typography color="text.secondary">(Commissions will be displayed here)</Typography>
      </Box>
    </>
  );
}
