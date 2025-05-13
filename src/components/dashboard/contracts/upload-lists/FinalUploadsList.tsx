import React from "react";
import { Box, Typography, Grid, Chip, LinearProgress } from "@mui/material";
import UploadCard from "./UploadCard";

interface FinalUploadsListProps {
  uploads: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  isClient: boolean;
}

const FinalUploadsList: React.FC<FinalUploadsListProps> = ({
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
        <Typography color="textSecondary">No final uploads found</Typography>
      </Box>
    );
  }

  // Custom renderer for final upload specific content
  const renderExtraContent = (upload: any) => {
    return (
      <>
        {upload.workProgress !== undefined && (
          <Box sx={{ mt: 1 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">Progress:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {upload.workProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={upload.workProgress}
              color={upload.workProgress < 100 ? "warning" : "success"}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.05)",
              }}
            />
          </Box>
        )}

        {upload.cancelTicketId && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Cancel Ticket: {upload.cancelTicketId.toString().substring(0, 8)}...
          </Typography>
        )}
      </>
    );
  };

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <UploadCard
            upload={upload}
            username={username}
            contractId={contractId}
            uploadType="final"
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

export default FinalUploadsList;
