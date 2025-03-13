// src/components/ProfileContent.tsx
"use client";
import { Box, Typography, Button, Avatar, Stack } from "@mui/material";

interface ProfileContentProps {
  profile: any;
  isOwner: boolean;
  onEditProfile: () => void;
}

const ProfileContent = ({ profile, isOwner, onEditProfile }: ProfileContentProps) => (
  <>
    {/* Banner */}
    <Box
      sx={{
        width: "100%",
        height: 200,
        backgroundImage: `url(${profile.banner || "/default-banner.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 2,
      }}
    />
    
    {/* Profile Info */}
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: -6, ml: 3 }}>
      <Avatar
        src={profile.profilePicture || "/default-profile.png"}
        sx={{ width: 100, height: 100, border: "4px solid white" }}
      />
      <Box>
        <Typography variant="h5" fontWeight="bold">
          {profile.username}
        </Typography>
        <Typography color="text.secondary">{profile.bio || "No bio yet."}</Typography>
      </Box>
    </Stack>
    
    {/* Profile Actions */}
    {isOwner && (
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={onEditProfile}>
          Edit Profile
        </Button>
        <Button variant="contained" color="secondary">Upload Art</Button>
        <Button variant="contained">Create Commission</Button>
      </Stack>
    )}
    
    {/* Portfolio Section */}
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight="bold">Portfolio</Typography>
      <Typography color="text.secondary">(Artwork will be displayed here)</Typography>
    </Box>
    
    {/* Commission Listings */}
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight="bold">Commission Listings</Typography>
      <Typography color="text.secondary">(Commissions will be displayed here)</Typography>
    </Box>
  </>
);

export default ProfileContent;