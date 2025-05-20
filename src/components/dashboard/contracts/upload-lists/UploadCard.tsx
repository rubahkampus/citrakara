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
  getStatusColor: (
    status: string
  ) =>
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "success"
    | "info";
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

  // Function to check if upload is expired
  const isExpired = (upload: any) => {
    return upload.expiresAt && new Date(upload.expiresAt) < new Date();
  };

  const expired = isExpired(upload);

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
        opacity: expired && upload.status === 'submitted' ? 0.7 : 1,
        backgroundColor: expired && upload.status === 'submitted' ? "rgba(0, 0, 0, 0.03)" : "background.paper",
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

          {/* Status chips */}
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              alignItems: "flex-end",
            }}
          >
            {upload.status && (
              <Chip
                label={
                  expired && upload.status === "submitted"
                    ? "Auto-Accepted"
                    : upload.status
                }
                color={
                  expired && upload.status === "submitted"
                    ? "success"
                    : getStatusColor(upload.status)
                }
                size="small"
                sx={{
                  textTransform: "capitalize",
                }}
              />
            )}

            {expired && (
              <Chip
                label="Expired"
                color="default"
                size="small"
                sx={{
                  backgroundColor: "rgba(0,0,0,0.1)",
                }}
              />
            )}
          </Box>

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
          alignItems="flex-start"
          mb={1}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {actualUploadType.charAt(0).toUpperCase() +
              actualUploadType.slice(1)}{" "}
            {upload.workProgress < 100 && actualUploadType === "final"
              ? "(Partial)"
              : ""}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatDate(upload.createdAt)}
            </Typography>
            {upload.expiresAt && (
              <Typography
                variant="caption"
                color={expired ? "error" : "text.secondary"}
              >
                {expired ? "Expired: " : "Expires: "}
                {formatDate(upload.expiresAt)}
              </Typography>
            )}
          </Box>
        </Box>

        {upload.description && (
          <Typography variant="body2" noWrap>
            {upload.description.substring(0, 50)}
            {upload.description.length > 50 ? "..." : ""}
          </Typography>
        )}

        {/* Render extra content if provided */}
        {renderExtraContent && renderExtraContent(upload)}

        {/* Review button for clients or automatic acceptance message */}
        {upload.status === "submitted" && isClient && (
          <Box mt={1}>
            {expired ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  textAlign: "center",
                  p: 1,
                  bgcolor: "background.default",
                  borderRadius: 1,
                  fontStyle: "italic",
                }}
              >
                Diterima otomatis karena klien tidak membalas tepat waktu
              </Typography>
            ) : (
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
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default UploadCard;
