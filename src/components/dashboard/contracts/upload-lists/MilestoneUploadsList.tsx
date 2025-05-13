import React from "react";
import { Box, Typography, Grid, Chip } from "@mui/material";
import UploadCard from "./UploadCard";

interface MilestoneUploadsListProps {
  uploads: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  isClient: boolean;
}

const MilestoneUploadsList: React.FC<MilestoneUploadsListProps> = ({
  uploads,
  username,
  contractId,
  formatDate,
  getStatusColor,
  isClient,
}) => {
  if (uploads.length === 0) {
    return (
      <Box
        p={3}
        textAlign="center"
        bgcolor="background.paper"
        borderRadius={1}
        boxShadow={1}
      >
        <Typography color="textSecondary">
          No milestone uploads found
        </Typography>
      </Box>
    );
  }

  // Custom renderer for milestone specific content
  const renderExtraContent = (upload: any) => {
    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <Typography variant="body2">
            Milestone:{" "}
            {upload.milestoneIdx !== undefined ? upload.milestoneIdx + 1 : "?"}
          </Typography>

          {upload.isFinal && (
            <Chip label="Final" color="primary" size="small" sx={{ ml: 1 }} />
          )}
        </Box>
      </>
    );
  };

  // Custom handler for the upload card to add additional chips
  const customizeUploadCard = (upload: any, card: React.ReactElement) => {
    return card;
  };

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <UploadCard
            upload={upload}
            username={username}
            contractId={contractId}
            uploadType="milestone"
            formatDate={formatDate}
            getStatusColor={(status) =>
              getStatusColor(status) as
                | "default"
                | "primary"
                | "secondary"
                | "error"
                | "warning"
                | "success"
                | "info"
            }
            isClient={isClient}
            renderExtraContent={renderExtraContent}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default MilestoneUploadsList;
