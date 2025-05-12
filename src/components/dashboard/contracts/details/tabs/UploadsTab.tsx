// src/components/dashboard/contracts/tabs/UploadsTab.tsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";

interface UploadsTabProps {
  contract: IContract;
  username: string;
}

const UploadsTab: React.FC<UploadsTabProps> = ({ contract, username }) => {
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Uploads</Typography>
        <Link
          href={`/${username}/dashboard/contracts/${contract._id}/uploads`}
          passHref
        >
          <Button size="small" variant="outlined">
            View All Uploads
          </Button>
        </Link>
      </Box>

      {contract.progressUploadsStandard?.length === 0 &&
      contract.progressUploadsMilestone?.length === 0 &&
      contract.revisionUploads?.length === 0 &&
      contract.finalUploads?.length === 0 ? (
        <Typography color="textSecondary">No uploads found</Typography>
      ) : (
        <Box>
          {contract.progressUploadsStandard?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Progress Uploads (Standard)
              </Typography>
              <Typography>
                {contract.progressUploadsStandard.length} upload(s)
              </Typography>
            </Box>
          )}

          {contract.progressUploadsMilestone?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Progress Uploads (Milestone)
              </Typography>
              <Typography>
                {contract.progressUploadsMilestone.length} upload(s)
              </Typography>
            </Box>
          )}

          {contract.revisionUploads?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Revision Uploads
              </Typography>
              <Typography>
                {contract.revisionUploads.length} upload(s)
              </Typography>
            </Box>
          )}

          {contract.finalUploads?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Final Uploads
              </Typography>
              <Typography>{contract.finalUploads.length} upload(s)</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UploadsTab;
