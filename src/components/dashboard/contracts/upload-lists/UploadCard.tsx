import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  useTheme,
} from "@mui/material";
import Link from "next/link";

interface UploadCardProps {
  upload: any;
  username: string;
  contractId: string;
  uploadType: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => "default" | "primary" | "secondary" | "error" | "warning" | "success" | "info";
  isClient: boolean;
  renderExtraContent?: (upload: any) => React.ReactNode;
}

const UploadCard: React.FC<UploadCardProps> = ({
  upload,
  username,
  contractId,
  uploadType,
  formatDate,
  getStatusColor,
  isClient,
  renderExtraContent,
}) => {
  const theme = useTheme();
  const actualUploadType = upload.type || uploadType;

  return (
    <Paper
      elevation={1}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 1,
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Link
        href={`/${username}/dashboard/contracts/${contractId}/uploads/${actualUploadType}/${upload._id}`}
        passHref
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Box
          sx={{
            height: 200,
            overflow: "hidden",
            position: "relative",
            "&:hover": {
              "& > .overlay": {
                opacity: 1,
              },
            },
          }}
        >
          {upload.images && upload.images.length > 0 ? (
            <Box
              component="img"
              src={upload.images[0]}
              alt={`${actualUploadType} upload`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
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

          {/* Status chip */}
          {upload.status && (
            <Chip
              label={upload.status}
              color={getStatusColor(upload.status) as "default" | "primary" | "secondary" | "error" | "warning" | "success" | "info"}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                textTransform: "capitalize",
              }}
            />
          )}

          {/* Overlay with number of images indicator */}
          {upload.images && upload.images.length > 1 && (
            <Box
              className="overlay"
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "white",
                p: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography variant="body2">
                {upload.images.length} images
              </Typography>
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
            {actualUploadType.charAt(0).toUpperCase() +
              actualUploadType.slice(1)}{" "}
            {upload.workProgress < 100 && actualUploadType === "final"
              ? "(Partial)"
              : ""}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(upload.createdAt)}
          </Typography>
        </Box>

        {upload.description && (
          <Typography variant="body2" noWrap>
            {upload.description.substring(0, 50)}
            {upload.description.length > 50 ? "..." : ""}
          </Typography>
        )}

        {/* Render extra content if provided */}
        {renderExtraContent && renderExtraContent(upload)}

        {/* Review button for clients */}
        {upload.status === "submitted" && isClient && (
          <Box mt={1}>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/uploads/${actualUploadType}/${upload._id}?review=true`}
              passHref
            >
              <Button
                size="small"
                variant="contained"
                fullWidth
                sx={{ borderRadius: 1 }}
              >
                Review
              </Button>
            </Link>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default UploadCard;
