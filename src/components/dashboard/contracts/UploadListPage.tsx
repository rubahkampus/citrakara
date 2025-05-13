"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Stack,
  Badge,
  Paper,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import {
  ImageOutlined,
  UploadFile,
  CollectionsOutlined,
  HighlightAlt,
  CheckCircleOutline,
} from "@mui/icons-material";

// Import upload list components
import {
  AllUploadsList,
  ProgressUploadsList,
  MilestoneUploadsList,
  RevisionUploadsList,
  FinalUploadsList,
} from "./upload-lists";

// Import utilities
import { formatDate, getStatusColor } from "@/lib/utils/formatters";

interface UploadsListPageProps {
  username: string;
  contractId: string;
  uploads: {
    progressStandard: any[];
    progressMilestone: any[];
    revision: any[];
    final: any[];
  };
  isArtist: boolean;
  isClient: boolean;
  contractStatus: string;
}

const UploadsListPage: React.FC<UploadsListPageProps> = ({
  username,
  contractId,
  uploads,
  isArtist,
  isClient,
  contractStatus,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const isActive = contractStatus === "active";

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Action Buttons rendering
  const renderActionButtons = () => {
    if (!isActive || !isArtist) return null;

    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ mt: { xs: 2, sm: 0 } }}
      >
        <Link
          href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/new`}
          passHref
        >
          <Button size="small" variant="outlined" startIcon={<UploadFile />}>
            Progress
          </Button>
        </Link>

        <Link
          href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/new`}
          passHref
        >
          <Button size="small" variant="outlined" startIcon={<HighlightAlt />}>
            Milestone
          </Button>
        </Link>

        <Link
          href={`/${username}/dashboard/contracts/${contractId}/uploads/final/new`}
          passHref
        >
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<CheckCircleOutline />}
          >
            Final Delivery
          </Button>
        </Link>
      </Stack>
    );
  };

  // Calculate total uploads for badges
  const totalUploads = {
    progress: uploads.progressStandard.length,
    milestone: uploads.progressMilestone.length,
    revision: uploads.revision.length,
    final: uploads.final.length,
    all:
      uploads.progressStandard.length +
      uploads.progressMilestone.length +
      uploads.revision.length +
      uploads.final.length,
  };

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
      >
        <Typography variant="h6" fontWeight="bold">
          <CollectionsOutlined sx={{ mr: 1, verticalAlign: "middle" }} />
          Contract Uploads
        </Typography>
        {renderActionButtons()}
      </Box>

      <Paper
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          mb: 3,
          boxShadow: theme.shadows[1],
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Tab
            label={
              <Badge
                badgeContent={totalUploads.all}
                color="primary"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>All</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={totalUploads.progress}
                color="info"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Progress</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={totalUploads.milestone}
                color="secondary"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Milestone</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={totalUploads.revision}
                color="warning"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Revision</span>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={totalUploads.final}
                color="success"
                max={99}
                showZero
              >
                <span style={{ marginRight: "8px" }}>Final</span>
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ mt: 2 }}>
        {tabValue === 0 && (
          <AllUploadsList
            uploads={uploads}
            username={username}
            contractId={contractId}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            isClient={isClient}
          />
        )}

        {tabValue === 1 && (
          <ProgressUploadsList
            uploads={uploads.progressStandard}
            username={username}
            contractId={contractId}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            isClient={isClient}
          />
        )}

        {tabValue === 2 && (
          <MilestoneUploadsList
            uploads={uploads.progressMilestone}
            username={username}
            contractId={contractId}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            isClient={isClient}
          />
        )}

        {tabValue === 3 && (
          <RevisionUploadsList
            uploads={uploads.revision}
            username={username}
            contractId={contractId}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            isClient={isClient}
          />
        )}

        {tabValue === 4 && (
          <FinalUploadsList
            uploads={uploads.final}
            username={username}
            contractId={contractId}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            isClient={isClient}
          />
        )}
      </Box>
    </Box>
  );
};

export default UploadsListPage;
