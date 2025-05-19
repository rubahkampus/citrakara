// src/components/dashboard/contracts/tabs/UploadsTab.tsx
import React from "react";
import { Box, Typography, Button, Grid, Paper, useTheme } from "@mui/material";
import Link from "next/link";
import {
  CloudUploadOutlined,
  TimelineOutlined,
  HistoryEduOutlined,
  DoneAllOutlined,
  UploadFileOutlined,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";

// Indonesian translations
const TRANSLATIONS = {
  uploads: "Unggahan",
  viewAllUploads: "Lihat Semua Unggahan",
  noUploadsFound: "Tidak ada unggahan ditemukan",
  progressUploadsStandard: "Unggahan Progres (Standar)",
  progressUploadsMilestone: "Unggahan Progres (Milestone)",
  revisionUploads: "Unggahan Revisi",
  finalUploads: "Unggahan Final",
};

interface UploadsTabProps {
  contract: IContract;
  username: string;
}

const UploadsTab: React.FC<UploadsTabProps> = ({ contract, username }) => {
  const theme = useTheme();

  // Get upload counts
  const progressStandardCount = contract.progressUploadsStandard?.length || 0;
  const progressMilestoneCount = contract.progressUploadsMilestone?.length || 0;
  const revisionCount = contract.revisionUploads?.length || 0;
  const finalCount = contract.finalUploads?.length || 0;
  const totalCount =
    progressStandardCount + progressMilestoneCount + revisionCount + finalCount;

  // Upload type styling configuration
  const uploadTypes = [
    {
      label: TRANSLATIONS.progressUploadsStandard,
      count: progressStandardCount,
      icon: <TimelineOutlined fontSize="small" />,
      color: "primary",
      bgColor: theme.palette.primary.light,
    },
    {
      label: TRANSLATIONS.progressUploadsMilestone,
      count: progressMilestoneCount,
      icon: <HistoryEduOutlined fontSize="small" />,
      color: "info",
      bgColor: theme.palette.info.light,
    },
    {
      label: TRANSLATIONS.revisionUploads,
      count: revisionCount,
      icon: <CloudUploadOutlined fontSize="small" />,
      color: "warning",
      bgColor: theme.palette.warning.light,
    },
    {
      label: TRANSLATIONS.finalUploads,
      count: finalCount,
      icon: <DoneAllOutlined fontSize="small" />,
      color: "success",
      bgColor: theme.palette.success.light,
    },
  ];

  return (
    <Box>
      {/* Header with view all button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          variant="h6"
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          <UploadFileOutlined
            sx={{
              mr: 1,
              fontSize: 20,
              color: theme.palette.primary.main,
            }}
          />
          {TRANSLATIONS.uploads}
        </Typography>

        <Link
          href={`/${username}/dashboard/contracts/${contract._id}/uploads`}
          passHref
        >
          <Button
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            {TRANSLATIONS.viewAllUploads}
          </Button>
        </Link>
      </Box>

      {/* Upload counts display */}
      {totalCount === 0 ? (
        <Typography color="text.secondary" sx={{ fontStyle: "italic", mt: 1 }}>
          {TRANSLATIONS.noUploadsFound}
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {uploadTypes.map(
            (type, index) =>
              type.count > 0 && (
                <Grid item xs={6} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "5px",
                        height: "100%",
                        backgroundColor: `${type.bgColor}`,
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Box
                        sx={{
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {type.icon}
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                      >
                        {type.label}
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center">
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ ml: 0.5 }}
                      >
                        {type.count}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )
          )}
        </Grid>
      )}
    </Box>
  );
};

export default UploadsTab;
