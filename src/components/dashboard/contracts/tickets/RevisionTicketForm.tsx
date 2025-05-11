// src/components/dashboard/contracts/tickets/RevisionTicketForm.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";

interface RevisionTicketFormProps {
  contract: IContract;
  userId: string;
  isClient: boolean;
}

export default function RevisionTicketForm({
  contract,
  userId,
  isClient,
}: RevisionTicketFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [milestoneIdx, setMilestoneIdx] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [revisionInfo, setRevisionInfo] = useState<{
    type: string;
    isFree: boolean;
    remainingFree: number;
    isPaid: boolean;
    fee: number;
  }>({
    type: "",
    isFree: true,
    remainingFree: 0,
    isPaid: false,
    fee: 0,
  });

  // Determine revision policy on load and when milestone changes
  useEffect(() => {
    const getRevisionInfo = () => {
      const revisionType =
        contract.proposalSnapshot.listingSnapshot.revisions?.type || "none";

      if (revisionType === "none") {
        return {
          type: "none",
          isFree: false,
          remainingFree: 0,
          isPaid: false,
          fee: 0,
        };
      }

      if (revisionType === "standard" && contract.revisionPolicy) {
        const policy = contract.revisionPolicy;
        const revisionsDone = contract.revisionDone || 0;
        const remainingFree = policy
          ? Math.max(0, policy.free - revisionsDone)
          : 0;

        return {
          type: "standard",
          isFree: remainingFree > 0,
          remainingFree,
          isPaid: remainingFree === 0 && policy?.extraAllowed,
          fee: policy?.fee || 0,
        };
      }

      if (revisionType === "milestone" && milestoneIdx !== null) {
        const milestone = contract.milestones?.[parseInt(milestoneIdx)];
        if (!milestone || !milestone.revisionPolicy) {
          return {
            type: "milestone",
            isFree: false,
            remainingFree: 0,
            isPaid: false,
            fee: 0,
          };
        }

        const policy = milestone.revisionPolicy;
        const revisionsDone = milestone.revisionDone || 0;
        const remainingFree = policy
          ? Math.max(0, policy.free - revisionsDone)
          : 0;

        return {
          type: "milestone",
          isFree: remainingFree > 0,
          remainingFree,
          isPaid: remainingFree === 0 && policy?.extraAllowed,
          fee: policy?.fee || 0,
        };
      }

      return {
        type: revisionType,
        isFree: false,
        remainingFree: 0,
        isPaid: false,
        fee: 0,
      };
    };

    setRevisionInfo(getRevisionInfo());
  }, [contract, milestoneIdx]);

  // Handle milestone selection change
  const handleMilestoneChange = (event: SelectChangeEvent) => {
    setMilestoneIdx(event.target.value);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Create and set preview URLs
      const newPreviewUrls = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviewUrls((prevUrls) => {
        // Revoke previous URLs to avoid memory leaks
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
        return newPreviewUrls;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate input
      if (!description.trim()) {
        throw new Error(
          "Please provide a description of the revision you need"
        );
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", description);

      if (milestoneIdx !== null) {
        formData.append("milestoneIdx", milestoneIdx);
      }

      files.forEach((file) => {
        formData.append("referenceImages[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/tickets/revision/new`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create revision request");
      }

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/contracts/${contract._id}/tickets`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if revisions are allowed
  if (contract.proposalSnapshot.listingSnapshot.revisions?.type === "none") {
    return (
      <Alert severity="error">This contract does not allow revisions.</Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Revision request submitted successfully! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Revision Policy
            </Typography>
            {contract.proposalSnapshot.listingSnapshot.revisions?.type ===
              "standard" && (
              <>
                <Typography variant="body2">
                  Standard revision policy applies to the entire contract.
                </Typography>
                <Typography variant="body2">
                  Free revisions remaining: {revisionInfo.remainingFree}
                </Typography>
                {revisionInfo.isPaid && (
                  <Typography variant="body2">
                    Paid revisions available for {revisionInfo.fee} each.
                  </Typography>
                )}
              </>
            )}

            {contract.proposalSnapshot.listingSnapshot.revisions?.type ===
              "milestone" && (
              <>
                <Typography variant="body2">
                  Each milestone has its own revision policy.
                </Typography>
                {milestoneIdx !== null && (
                  <>
                    <Typography variant="body2">
                      Free revisions remaining: {revisionInfo.remainingFree}
                    </Typography>
                    {revisionInfo.isPaid && (
                      <Typography variant="body2">
                        Paid revisions available for {revisionInfo.fee} each.
                      </Typography>
                    )}
                  </>
                )}
              </>
            )}
          </Box>

          {/* Milestone selector for milestone-based contracts */}
          {contract.proposalSnapshot.listingSnapshot.revisions?.type ===
            "milestone" && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="milestone-select-label">
                  Select Milestone
                </InputLabel>
                <Select
                  labelId="milestone-select-label"
                  id="milestone-select"
                  value={milestoneIdx || ""}
                  label="Select Milestone"
                  onChange={handleMilestoneChange}
                  required
                >
                  {contract.milestones?.map((milestone, index) => (
                    <MenuItem key={index} value={index}>
                      {milestone.title} - {milestone.status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Revision request details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Revision Request Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please describe the changes you need as clearly as possible.
            </Typography>

            {!revisionInfo.isFree && revisionInfo.isPaid && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  This will be a paid revision.
                </Typography>
                <Typography variant="body2">Fee: {revisionInfo.fee}</Typography>
                <Typography variant="body2">
                  You'll need to approve and pay this fee after the artist
                  accepts the revision request.
                </Typography>
              </Alert>
            )}

            {!revisionInfo.isFree && !revisionInfo.isPaid && (
              <Alert severity="error" sx={{ mb: 2 }}>
                You have used all available revisions for this{" "}
                {revisionInfo.type === "standard" ? "contract" : "milestone"}.
              </Alert>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Revision Description"
              multiline
              rows={4}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the changes you need..."
              required
              disabled={
                isSubmitting || (!revisionInfo.isFree && !revisionInfo.isPaid)
              }
            />
          </Box>

          {/* Reference images */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Reference Images (Optional)
            </Typography>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={
                isSubmitting || (!revisionInfo.isFree && !revisionInfo.isPaid)
              }
              style={{ marginBottom: "16px" }}
            />

            {previewUrls.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {previewUrls.map((url, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={url}
                    alt={`Preview ${index}`}
                    sx={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={
              isSubmitting || (!revisionInfo.isFree && !revisionInfo.isPaid)
            }
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Submit Revision Request"
            )}
          </Button>
        </form>
      )}
    </Paper>
  );
}
