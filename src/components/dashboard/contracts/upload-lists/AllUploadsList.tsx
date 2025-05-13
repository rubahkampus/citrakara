import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import UploadCard from "./UploadCard";

interface AllUploadsListProps {
  uploads: {
    progressStandard: any[];
    progressMilestone: any[];
    revision: any[];
    final: any[];
  };
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  isClient: boolean;
}

const AllUploadsList: React.FC<AllUploadsListProps> = ({
  uploads,
  username,
  contractId,
  formatDate,
  getStatusColor,
  isClient,
}) => {
  const allUploads = [
    ...uploads.progressStandard.map((upload: any) => ({
      ...upload,
      type: "progress",
    })),
    ...uploads.progressMilestone.map((upload: any) => ({
      ...upload,
      type: "milestone",
    })),
    ...uploads.revision.map((upload: any) => ({ ...upload, type: "revision" })),
    ...uploads.final.map((upload: any) => ({ ...upload, type: "final" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (allUploads.length === 0) {
    return (
      <Box
        p={3}
        textAlign="center"
        bgcolor="background.paper"
        borderRadius={1}
        boxShadow={1}
      >
        <Typography color="textSecondary">
          No uploads found for this contract
        </Typography>
      </Box>
    );
  }

  // Custom extra content renderer based on upload type
  const renderExtraContent = (upload: any) => {
    switch (upload.type) {
      case "milestone":
        return upload.milestoneIdx !== undefined ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Milestone: {upload.milestoneIdx + 1}
          </Typography>
        ) : null;

      case "final":
        return upload.workProgress !== undefined ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Progress: {upload.workProgress}%
          </Typography>
        ) : null;

      case "revision":
        return upload.revisionTicketId ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Ticket: {upload.revisionTicketId.toString().substring(0, 8)}...
          </Typography>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Grid container spacing={2}>
      {allUploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <UploadCard
            upload={upload}
            username={username}
            contractId={contractId}
            uploadType={upload.type}
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

export default AllUploadsList;
