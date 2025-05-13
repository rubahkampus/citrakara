import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import UploadCard from "./UploadCard";

interface RevisionUploadsListProps {
  uploads: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  isClient: boolean;
}

const RevisionUploadsList: React.FC<RevisionUploadsListProps> = ({
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
        <Typography color="textSecondary">No revision uploads found</Typography>
      </Box>
    );
  }

  // Custom renderer for revision specific content
  const renderExtraContent = (upload: any) => {
    return upload.revisionTicketId ? (
      <Typography variant="body2" sx={{ mt: 1 }}>
        Ticket: {upload.revisionTicketId.toString().substring(0, 8)}...
      </Typography>
    ) : null;
  };

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <UploadCard
            upload={upload}
            username={username}
            contractId={contractId}
            uploadType="revision"
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

export default RevisionUploadsList;
