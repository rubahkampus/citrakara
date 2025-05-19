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
  Tooltip,
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

// Constants - Indonesian translations
const TRANSLATIONS = {
  contractUploads: "Unggahan Kontrak",
  progress: "Kemajuan",
  milestone: "Milestone Pencapaian",
  revision: "Revisi",
  final: "Final",
  all: "Semua",
  finalDelivery: "Pengiriman Final",
};

// Types definition
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Action Buttons rendering
  const renderActionButtons = () => {
    if (!isActive || !isArtist) return null;

    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: { xs: 2, sm: 0 } }}
      >
        <Tooltip title={`Unggah ${TRANSLATIONS.progress}`} arrow>
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/new`}
            passHref
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadFile />}
              sx={{ borderRadius: 1.5 }}
            >
              {TRANSLATIONS.progress}
            </Button>
          </Link>
        </Tooltip>

        <Tooltip title={`Unggah ${TRANSLATIONS.milestone}`} arrow>
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/new`}
            passHref
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<HighlightAlt />}
              sx={{ borderRadius: 1.5 }}
            >
              {TRANSLATIONS.milestone}
            </Button>
          </Link>
        </Tooltip>

        <Tooltip title={TRANSLATIONS.finalDelivery} arrow>
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/uploads/final/new`}
            passHref
          >
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<CheckCircleOutline />}
              sx={{
                borderRadius: 1.5,
                boxShadow: theme.shadows[2],
                "&:hover": {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              {TRANSLATIONS.finalDelivery}
            </Button>
          </Link>
        </Tooltip>
      </Stack>
    );
  };

  // Tab badge component to reduce repetition
  interface TabBadgeProps {
    count: number;
    color: "primary" | "secondary" | "default" | "error" | "info" | "success" | "warning";
    label: string;
  }
  const TabBadge: React.FC<TabBadgeProps> = ({ count, color, label }) => (
    <Badge
      badgeContent={count}
      color={color}
      max={99}
      showZero
      sx={{ "& .MuiBadge-badge": { fontWeight: 600 } }}
    >
      <span style={{ marginRight: "8px" }}>{label}</span>
    </Badge>
  );

  // Tab panel content renderer
  const renderTabContent = () => {
    const sharedProps = {
      username,
      contractId,
      formatDate,
      getStatusColor,
      isClient,
    };

    switch (tabValue) {
      case 0:
        return <AllUploadsList uploads={uploads} {...sharedProps} />;
      case 1:
        return (
          <ProgressUploadsList
            uploads={uploads.progressStandard}
            {...sharedProps}
          />
        );
      case 2:
        return (
          <MilestoneUploadsList
            uploads={uploads.progressMilestone}
            {...sharedProps}
          />
        );
      case 3:
        return (
          <RevisionUploadsList uploads={uploads.revision} {...sharedProps} />
        );
      case 4:
        return <FinalUploadsList uploads={uploads.final} {...sharedProps} />;
      default:
        return <AllUploadsList uploads={uploads} {...sharedProps} />;
    }
  };

  return (
    <Box>
      {/* Header section */}
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        sx={{
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            display: "flex",
            alignItems: "center",
            color: theme.palette.text.primary,
          }}
        >
          <CollectionsOutlined
            sx={{
              mr: 1,
              color: theme.palette.primary.main,
            }}
          />
          {TRANSLATIONS.contractUploads}
        </Typography>
        {renderActionButtons()}
      </Box>

      {/* Tabs navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
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
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 500,
            },
            "& .Mui-selected": {
              fontWeight: 600,
            },
          }}
        >
          <Tab
            label={
              <TabBadge
                count={totalUploads.all}
                color="primary"
                label={TRANSLATIONS.all}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalUploads.progress}
                color="info"
                label={TRANSLATIONS.progress}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalUploads.milestone}
                color="secondary"
                label={TRANSLATIONS.milestone}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalUploads.revision}
                color="warning"
                label={TRANSLATIONS.revision}
              />
            }
          />
          <Tab
            label={
              <TabBadge
                count={totalUploads.final}
                color="success"
                label={TRANSLATIONS.final}
              />
            }
          />
        </Tabs>
      </Paper>

      {/* Tab content section */}
      <Box sx={{ mt: 2 }}>{renderTabContent()}</Box>
    </Box>
  );
};

export default UploadsListPage;
