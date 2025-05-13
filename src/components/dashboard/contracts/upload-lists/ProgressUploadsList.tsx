import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import UploadCard from "./UploadCard";

interface ProgressUploadsListProps {
  uploads: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  isClient: boolean;
}

const ProgressUploadsList: React.FC<ProgressUploadsListProps> = ({
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
        <Typography color="textSecondary">No progress uploads found</Typography>
      </Box>
    );
  }

  // Custom renderer for progress specific content
  const renderExtraContent = (upload: any) => {
    return upload.images && upload.images.length > 1 ? (
      <Typography variant="body2" sx={{ mt: 1 }}>
        {upload.images.length} images
      </Typography>
    ) : null;
  };

  const sortedUpload = uploads.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Grid container spacing={2}>
      {sortedUpload.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <UploadCard
            upload={upload}
            username={username}
            contractId={contractId}
            uploadType="progress"
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

export default ProgressUploadsList;
