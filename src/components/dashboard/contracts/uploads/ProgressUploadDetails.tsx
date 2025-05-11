// src/components/dashboard/contracts/uploads/ProgressUploadDetails.tsx
"use client";

import { Box, Paper, Typography, Divider } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import { IProgressUploadStandard } from "@/lib/db/models/upload.model";

interface ProgressUploadDetailsProps {
  contract: IContract;
  upload: IProgressUploadStandard;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

export default function ProgressUploadDetails({
  contract,
  upload,
  userId,
  isArtist,
  isClient,
}: ProgressUploadDetailsProps) {
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Progress Update</Typography>
        <Typography variant="body2" color="text.secondary">
          Uploaded by {isArtist ? "you" : "the artist"} on{" "}
          {formatDate(upload.createdAt)}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Images */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Images
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {upload.images.map((url, index) => (
            <Box
              key={index}
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "block",
                width: {
                  xs: "100%",
                  sm: "calc(50% - 8px)",
                  md: "calc(33.33% - 11px)",
                },
              }}
            >
              <Box
                component="img"
                src={url}
                alt={`Progress ${index + 1}`}
                sx={{
                  width: "100%",
                  height: "auto",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid #eee",
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Description */}
      {upload.description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            Description
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
            {upload.description}
          </Typography>
        </Box>
      )}

      {/* Note */}
      <Box>
        <Typography variant="body2" color="text.secondary">
          This is an informal progress update. No client response is required.
        </Typography>
      </Box>
    </Paper>
  );
}
