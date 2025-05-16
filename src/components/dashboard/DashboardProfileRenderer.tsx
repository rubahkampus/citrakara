// src/components/dashboard/DashboardProfileRenderer.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Grid,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  Language as WebsiteIcon,
  Email as EmailIcon,
} from "@mui/icons-material";

import { KButton } from "@/components/KButton";
import { useDialogStore } from "@/lib/stores";
import TosCard from "./TosCard";
import { IUser } from "@/lib/db/models/user.model";
import theme from "@/theme";

// Types
interface ProfileCardProps {
  profile: IUser;
  mounted: boolean;
  isOwner: boolean;
  handleEditProfile: () => void;
}

interface QuickActionsCardProps {
  handleCreateCommission: () => void;
  handleUploadArtwork: () => void;
}

interface StatsCardProps {
  profile: IUser;
  saldo: number;
}

interface SocialLinkProps {
  social: { label: string; url: string };
}

interface Props {
  profile: IUser;
  saldo: number;
  tosSummary?: string;
  isOwner?: boolean;
}

// Components
const ProfileCard = ({
  profile,
  mounted,
  isOwner,
  handleEditProfile,
}: ProfileCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        mb: 3,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "center", sm: "flex-start" }}
        sx={{ mb: 3 }}
      >
        <Avatar
          src={
            mounted
              ? `${profile.profilePicture}?t=${Date.now()}`
              : profile.profilePicture
          }
          alt={profile.displayName || profile.username}
          sx={{
            width: { xs: 100, sm: 80 },
            height: { xs: 100, sm: 80 },
            borderRadius: "50%",
            border: "3px solid",
            borderColor: "primary.light",
          }}
        />

        <Box sx={{ textAlign: { xs: "center", sm: "left" }, flexGrow: 1 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {profile.displayName || profile.username}
          </Typography>

          <Typography color="text.secondary" gutterBottom>
            {profile.email}
          </Typography>

          {profile.openForCommissions && (
            <Typography
              component="span"
              variant="body2"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.8,
                py: 0.8,
                mb: 1.25,
                mt: 1,
                bgcolor: profile.openForCommissions
                  ? theme.palette.success.light
                  : "grey.300",
                color: profile.openForCommissions ? "white" : "text.primary",
                borderRadius: "16px",
                fontWeight: 600,
                boxShadow: profile.openForCommissions
                  ? "0 3px 5px rgba(0,0,0,0.1)"
                  : "none",
                transition: "0.3s",
                "&:hover": profile.openForCommissions
                  ? {
                      bgcolor: theme.palette.success.main,
                      cursor: "pointer",
                      transform: "translateY(-2px)",
                      boxShadow: "0 5px 10px rgba(0,0,0,0.15)",
                    }
                  : {},
              }}
            >
              {profile.openForCommissions
                ? "Tersedia untuk komisi"
                : "Tidak tersedia untuk komisi"}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              mt: 1,
              flexWrap: "wrap",
              justifyContent: { xs: "center", sm: "flex-start" },
              gap: 1,
            }}
          >
            {profile.tags &&
              profile.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                  }}
                />
              ))}

            {profile.tags && profile.tags.length > 3 && (
              <Chip
                label={`+${profile.tags.length - 3} lainnya`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {profile.bio && (
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              {profile.bio}
            </Typography>
          )}
        </Box>

        {isOwner && (
          <KButton
            onClick={handleEditProfile}
            variantType="ghost"
            sx={{ alignSelf: { xs: "center", sm: "flex-start" }, px: 2 }}
            startIcon={<EditIcon />}
          >
            Ubah
          </KButton>
        )}
      </Stack>

      {profile.socials && profile.socials.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            {profile.socials.map((social, index) => (
              <SocialLink key={index} social={social} />
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
};

const SocialLink = ({ social }: SocialLinkProps) => {
  return (
    <Tooltip title={social.label}>
      <IconButton
        component="a"
        href={social.url}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        color="primary"
      ></IconButton>
    </Tooltip>
  );
};

const QuickActionsCard = ({
  handleCreateCommission,
  handleUploadArtwork,
}: QuickActionsCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Aksi Cepat
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={4}>
          <KButton
            fullWidth
            sx={{ py: 1.5 }}
            startIcon={<AddIcon />}
            onClick={handleCreateCommission}
          >
            Buat Komisi
          </KButton>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <KButton
            fullWidth
            variantType="secondary"
            sx={{ py: 1.5 }}
            startIcon={<AddIcon />}
            onClick={handleUploadArtwork}
          >
            Unggah Karya
          </KButton>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Main Component
export default function DashboardProfileRenderer({
  profile,
  saldo,
  isOwner = false,
}: Props) {
  const openDialog = useDialogStore((state) => state.open);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditProfile = () => {
    openDialog("editProfile", undefined, profile, isOwner);
  };

  const handleCreateCommission = () => {
    router.push(`/${profile.username}/dashboard/commissions/new`);
  };

  const handleUploadArtwork = () => {
    openDialog("uploadArtwork", undefined, undefined, isOwner);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <ProfileCard
        profile={profile}
        mounted={mounted}
        isOwner={isOwner}
        handleEditProfile={handleEditProfile}
      />

      <TosCard username={profile.username} isOwner={isOwner} />

      {isOwner && (
        <QuickActionsCard
          handleCreateCommission={handleCreateCommission}
          handleUploadArtwork={handleUploadArtwork}
        />
      )}
    </Box>
  );
}
