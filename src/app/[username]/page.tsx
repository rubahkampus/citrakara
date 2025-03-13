// src/app/[username]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  Container,
  CircularProgress,
  Typography,
} from "@mui/material";
import ProfileContent from "@/components/ProfileContent";
import EditProfileDialog from "@/components/ProfileDialog";

export default function ProfilePage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";
  const { user: loggedInUser } = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!username) return;
   
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

    fetchProfile();
  }, [username, loggedInUser]);

  const handleOpenEditDialog = () => setEditDialogOpen(true);

  return (
    <Container sx={{ mt: 4 }}>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : profile ? (
        <>
          <ProfileContent 
            profile={profile} 
            isOwner={isOwner} 
            onEditProfile={handleOpenEditDialog}
          />
          <EditProfileDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            profile={profile}
            onUpdateSuccess={setProfile}
          />
        </>
      ) : (
        <Typography>No profile data available</Typography>
      )}
    </Container>
  );
}