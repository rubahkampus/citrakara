"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  Container,
  Box,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Stack,
} from "@mui/material";

export default function ProfilePage() {
  const { username } = useParams(); // Get username from URL
  const { user: loggedInUser } = useAppSelector((state) => state.auth); // Watch for login/logout
  const [profile, setProfile] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosClient.get(`/api/user/${username}`);
        setProfile(response.data.user);
        setIsOwner(response.data.isOwner);
      } catch (err: any) {
        setError(err.response?.data?.error || "Profile not found");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, loggedInUser]); // 🔄 Re-fetch when user logs in/out

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading profile...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 5 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
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

      {/* Profile Actions (Only for Profile Owner) */}
      {isOwner && (
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" color="primary">Edit Profile</Button>
          <Button variant="contained" color="secondary">Upload Art</Button>
          <Button variant="contained">Create Commission</Button>
        </Stack>
      )}

      {/* Portfolio Section (Placeholder) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold">Portfolio</Typography>
        <Typography color="text.secondary">(Artwork will be displayed here)</Typography>
      </Box>

      {/* Commission Listings Section (Placeholder) */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold">Commission Listings</Typography>
        <Typography color="text.secondary">(Commissions will be displayed here)</Typography>
      </Box>
    </Container>
  );
}
