// src/components/dashboard/contracts/UploadsListPage.tsx
'use client'

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  Paper,
  Chip,
  Button,
  Stack,
  Grid,
} from "@mui/material";
import Link from "next/link";

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
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const isActive = contractStatus === "active";

  // Format date helper
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Get status color helper
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      submitted: "warning",
      accepted: "success",
      rejected: "error",
      forcedAccepted: "success",
      disputed: "warning",
    };

    return statusMap[status] || "default";
  };

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="h6">Contract Uploads</Typography>

        {isActive && isArtist && (
          <Stack direction="row" spacing={1}>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/new`}
              passHref
            >
              <Button size="small" variant="outlined">
                Upload Progress
              </Button>
            </Link>

            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/new`}
              passHref
            >
              <Button size="small" variant="outlined">
                Upload Milestone
              </Button>
            </Link>

            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/final/new`}
              passHref
            >
              <Button size="small" variant="outlined" color="primary">
                Upload Final Delivery
              </Button>
            </Link>
          </Stack>
        )}
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="All" />
        <Tab label={`Progress (${uploads.progressStandard.length})`} />
        <Tab label={`Milestone (${uploads.progressMilestone.length})`} />
        <Tab label={`Revision (${uploads.revision.length})`} />
        <Tab label={`Final (${uploads.final.length})`} />
      </Tabs>

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
  );
};

// All uploads list component
const AllUploadsList = ({
  uploads,
  username,
  contractId,
  formatDate,
  getStatusColor,
  isClient,
}: any) => {
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
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">
          No uploads found for this contract
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {allUploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <Paper
            elevation={1}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/${upload.type}/${upload._id}`}
              passHref
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  height: 200,
                  overflow: "hidden",
                  position: "relative",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {upload.images && upload.images.length > 0 ? (
                  <Box
                    component="img"
                    src={upload.images[0]}
                    alt={`${upload.type} upload`}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Typography color="textSecondary">No Image</Typography>
                  </Box>
                )}

                {upload.status && (
                  <Chip
                    label={upload.status}
                    color={getStatusColor(upload.status)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  />
                )}
              </Box>
            </Link>

            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {upload.type.charAt(0).toUpperCase() + upload.type.slice(1)}{" "}
                  Upload
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(upload.createdAt)}
                </Typography>
              </Box>

              {upload.description && (
                <Typography variant="body2" noWrap>
                  {upload.description.substring(0, 50)}
                  {upload.description.length > 50 ? "..." : ""}
                </Typography>
              )}

              {upload.type === "milestone" &&
                upload.milestoneIdx !== undefined && (
                  <Typography variant="body2">
                    Milestone: {upload.milestoneIdx}
                  </Typography>
                )}

              {upload.type === "final" && upload.workProgress !== undefined && (
                <Typography variant="body2">
                  Progress: {upload.workProgress}%
                </Typography>
              )}

              {upload.status === "submitted" && isClient && (
                <Box mt={1}>
                  <Link
                    href={`/${username}/dashboard/contracts/${contractId}/uploads/${upload.type}/${upload._id}?review=true`}
                    passHref
                  >
                    <Button size="small" variant="contained" fullWidth>
                      Review
                    </Button>
                  </Link>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// Progress uploads list component
const ProgressUploadsList = ({
  uploads,
  username,
  contractId,
  formatDate,
}: any) => {
  if (uploads.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">No progress uploads found</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <Paper
            elevation={1}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/${upload._id}`}
              passHref
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  height: 200,
                  overflow: "hidden",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {upload.images && upload.images.length > 0 ? (
                  <Box
                    component="img"
                    src={upload.images[0]}
                    alt="Progress upload"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Typography color="textSecondary">No Image</Typography>
                  </Box>
                )}
              </Box>
            </Link>

            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Progress Update
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(upload.createdAt)}
                </Typography>
              </Box>

              {upload.description && (
                <Typography variant="body2" noWrap>
                  {upload.description.substring(0, 50)}
                  {upload.description.length > 50 ? "..." : ""}
                </Typography>
              )}

              {upload.images && upload.images.length > 1 && (
                <Typography variant="body2">
                  {upload.images.length} images
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// Milestone uploads list component
const MilestoneUploadsList = ({
  uploads,
  username,
  contractId,
  formatDate,
  getStatusColor,
  isClient,
}: any) => {
  if (uploads.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">
          No milestone uploads found
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <Paper
            elevation={1}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/${upload._id}`}
              passHref
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  height: 200,
                  overflow: "hidden",
                  position: "relative",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {upload.images && upload.images.length > 0 ? (
                  <Box
                    component="img"
                    src={upload.images[0]}
                    alt="Milestone upload"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Typography color="textSecondary">No Image</Typography>
                  </Box>
                )}

                {upload.status && (
                  <Chip
                    label={upload.status}
                    color={getStatusColor(upload.status)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  />
                )}

                {upload.isFinal && (
                  <Chip
                    label="Final"
                    color="primary"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: upload.status ? 36 : 8,
                      right: 8,
                    }}
                  />
                )}
              </Box>
            </Link>

            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Milestone {upload.milestoneIdx}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(upload.createdAt)}
                </Typography>
              </Box>

              {upload.description && (
                <Typography variant="body2" noWrap>
                  {upload.description.substring(0, 50)}
                  {upload.description.length > 50 ? "..." : ""}
                </Typography>
              )}

              {upload.isFinal && upload.status === "submitted" && isClient && (
                <Box mt={1}>
                  <Link
                    href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/${upload._id}?review=true`}
                    passHref
                  >
                    <Button size="small" variant="contained" fullWidth>
                      Review
                    </Button>
                  </Link>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// Revision uploads list component
const RevisionUploadsList = ({
  uploads,
  username,
  contractId,
  formatDate,
  getStatusColor,
  isClient,
}: any) => {
  if (uploads.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">No revision uploads found</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <Paper
            elevation={1}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/revision/${upload._id}`}
              passHref
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  height: 200,
                  overflow: "hidden",
                  position: "relative",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {upload.images && upload.images.length > 0 ? (
                  <Box
                    component="img"
                    src={upload.images[0]}
                    alt="Revision upload"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Typography color="textSecondary">No Image</Typography>
                  </Box>
                )}

                {upload.status && (
                  <Chip
                    label={upload.status}
                    color={getStatusColor(upload.status)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  />
                )}
              </Box>
            </Link>

            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Revision Upload
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(upload.createdAt)}
                </Typography>
              </Box>

              {upload.description && (
                <Typography variant="body2" noWrap>
                  {upload.description.substring(0, 50)}
                  {upload.description.length > 50 ? "..." : ""}
                </Typography>
              )}

              <Typography variant="body2">
                Ticket: {upload.revisionTicketId.toString().substring(0, 8)}...
              </Typography>

              {upload.status === "submitted" && isClient && (
                <Box mt={1}>
                  <Link
                    href={`/${username}/dashboard/contracts/${contractId}/uploads/revision/${upload._id}?review=true`}
                    passHref
                  >
                    <Button size="small" variant="contained" fullWidth>
                      Review
                    </Button>
                  </Link>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

// Final uploads list component
const FinalUploadsList = ({
  uploads,
  username,
  contractId,
  formatDate,
  getStatusColor,
  isClient,
}: any) => {
  if (uploads.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="textSecondary">No final uploads found</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {uploads.map((upload: any) => (
        <Grid item xs={12} sm={6} md={4} key={upload._id.toString()}>
          <Paper
            elevation={1}
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/final/${upload._id}`}
              passHref
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Box
                sx={{
                  height: 200,
                  overflow: "hidden",
                  position: "relative",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {upload.images && upload.images.length > 0 ? (
                  <Box
                    component="img"
                    src={upload.images[0]}
                    alt="Final upload"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Typography color="textSecondary">No Image</Typography>
                  </Box>
                )}

                {upload.status && (
                  <Chip
                    label={upload.status}
                    color={getStatusColor(upload.status)}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                    }}
                  />
                )}

                {upload.workProgress < 100 && (
                  <Chip
                    label={`${upload.workProgress}%`}
                    color="warning"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: upload.status ? 36 : 8,
                      right: 8,
                    }}
                  />
                )}
              </Box>
            </Link>

            <Box sx={{ p: 2, flexGrow: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  Final Delivery {upload.workProgress < 100 ? "(Partial)" : ""}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatDate(upload.createdAt)}
                </Typography>
              </Box>

              {upload.description && (
                <Typography variant="body2" noWrap>
                  {upload.description.substring(0, 50)}
                  {upload.description.length > 50 ? "..." : ""}
                </Typography>
              )}

              {upload.cancelTicketId && (
                <Typography variant="body2">
                  Cancel Ticket:{" "}
                  {upload.cancelTicketId.toString().substring(0, 8)}...
                </Typography>
              )}

              {upload.status === "submitted" && isClient && (
                <Box mt={1}>
                  <Link
                    href={`/${username}/dashboard/contracts/${contractId}/uploads/final/${upload._id}?review=true`}
                    passHref
                  >
                    <Button size="small" variant="contained" fullWidth>
                      Review
                    </Button>
                  </Link>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default UploadsListPage;
