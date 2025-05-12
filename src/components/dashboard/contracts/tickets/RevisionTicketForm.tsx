// src/components/dashboard/contracts/tickets/RevisionTicketForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
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
  IconButton,
  Stack,
  Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { IContract } from "@/lib/db/models/contract.model";

interface RevisionTicketFormProps {
  contract: IContract;
  userId: string;
  username: string;
  isClient: boolean;
}

interface FormValues {
  description: string;
  milestoneIdx: string | null;
}

export default function RevisionTicketForm({
  contract,
  userId,
  username,
  isClient,
}: RevisionTicketFormProps) {
  const router = useRouter();
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      description: "",
      milestoneIdx: null,
    },
  });

  const watchMilestoneIdx = watch("milestoneIdx");
  const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  });

  // Set default milestone selection to current milestone for milestone-based contracts
  useEffect(() => {
    if (
      contract.proposalSnapshot.listingSnapshot.revisions?.type ===
        "milestone" &&
      contract.currentMilestoneIndex !== undefined
    ) {
      setValue("milestoneIdx", contract.currentMilestoneIndex.toString());
    }
  }, [contract, setValue]);

  // Determine revision policy on load and when milestone changes
  useEffect(() => {
    const getRevisionInfo = () => {
      const revisionType =
        contract.proposalSnapshot.listingSnapshot.revisions?.type || "none";

      // If no revisions allowed
      if (revisionType === "none") {
        return {
          type: "none",
          isFree: false,
          remainingFree: 0,
          isPaid: false,
          fee: 0,
        };
      }

      // Standard flow (applies to both standard and milestone flow with standard revisions)
      if (
        (revisionType === "standard" ||
          (revisionType === "milestone" && contract.revisionPolicy)) &&
        contract.revisionPolicy
      ) {
        const policy = contract.revisionPolicy;
        const revisionsDone = contract.revisionDone || 0;
        const remainingFree = Math.max(0, policy.free - revisionsDone);

        return {
          type: "standard",
          isFree: remainingFree > 0,
          remainingFree,
          isPaid: remainingFree === 0 && policy.extraAllowed,
          fee: policy.fee || 0,
        };
      }

      // Milestone-based revisions
      if (revisionType === "milestone" && watchMilestoneIdx !== null) {
        const milestone =
          contract.milestones?.[parseInt(watchMilestoneIdx || "0")];

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
        const remainingFree = Math.max(0, policy.free - revisionsDone);

        return {
          type: "milestone",
          isFree: remainingFree > 0,
          remainingFree,
          isPaid: remainingFree === 0 && policy.extraAllowed,
          fee: policy.fee || 0,
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
  }, [contract, watchMilestoneIdx]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Enforce the 5 file limit
      const totalFiles = [...files, ...selectedFiles];
      const limitedFiles = totalFiles.slice(0, 5);

      if (totalFiles.length > 5) {
        setError("Maximum 5 images allowed. Only the first 5 will be used.");
        setTimeout(() => setError(null), 3000);
      }

      setFiles(limitedFiles);

      // Create and set preview URLs
      const newPreviewUrls = limitedFiles.map((file) =>
        URL.createObjectURL(file)
      );

      // Revoke previous URLs to avoid memory leaks
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls(newPreviewUrls);
    }
  };

  // Remove a file and its preview
  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);

    setFiles(files.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);

      if (data.milestoneIdx !== null) {
        formData.append("milestoneIdx", data.milestoneIdx);
      }

      files.forEach((file) => {
        formData.append("referenceImages[]", file);
      });

      // Submit to API using axios
      await axiosClient.post(
        `/api/contract/${contract._id}/tickets/revision`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);

      // Redirect after successful submission
      // setTimeout(() => {
      //   router.push(`/dashboard//contracts/${contract._id}/tickets`);
      //   router.refresh();
      // }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(
          err.response.data.error || "Failed to create revision request"
        );
      } else {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
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

  // Get correct milestone options - only the current milestone or completed ones
  const getMilestoneOptions = () => {
    if (!contract.milestones) return [];

    return contract.milestones
      .filter(
        (milestone, idx) =>
          // Only allow current milestone or completed ones
          idx === contract.currentMilestoneIndex ||
          milestone.status === "accepted"
      )
      .map((milestone, originalIndex) => ({
        value: originalIndex.toString(),
        label: milestone.title,
        status: milestone.status,
      }));
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Revision request submitted successfully! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Revision Policy
            </Typography>

            {contract.proposalSnapshot.listingSnapshot.revisions?.type ===
              "standard" && (
              <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                <Typography variant="body1" gutterBottom>
                  Standard revision policy applies to the entire contract.
                </Typography>
                <Typography
                  variant="body2"
                  color={
                    revisionInfo.remainingFree > 0
                      ? "success.main"
                      : "text.secondary"
                  }
                >
                  Free revisions remaining: <b>{revisionInfo.remainingFree}</b>
                </Typography>
                {revisionInfo.isPaid && (
                  <Typography variant="body2" color="warning.main">
                    Paid revisions available for <b>{revisionInfo.fee}</b> each.
                  </Typography>
                )}
              </Box>
            )}

            {contract.proposalSnapshot.listingSnapshot.revisions?.type ===
              "milestone" && (
              <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                <Typography variant="body1" gutterBottom>
                  Each milestone has its own revision policy.
                </Typography>
                {watchMilestoneIdx !== null && (
                  <>
                    <Typography
                      variant="body2"
                      color={
                        revisionInfo.remainingFree > 0
                          ? "success.main"
                          : "text.secondary"
                      }
                    >
                      Free revisions remaining:{" "}
                      <b>{revisionInfo.remainingFree}</b>
                    </Typography>
                    {revisionInfo.isPaid && (
                      <Typography variant="body2" color="warning.main">
                        Paid revisions available for <b>{revisionInfo.fee}</b>{" "}
                        each.
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Milestone display for milestone-based contracts */}
          {contract.proposalSnapshot.listingSnapshot.revisions?.type ===
            "milestone" && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Current Milestone
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {isSubmitting ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CircularProgress size={20} sx={{ mr: 2 }} />
                    <Typography>Loading milestone data...</Typography>
                  </Box>
                ) : contract.currentMilestoneIndex !== undefined &&
                  contract.milestones &&
                  contract.milestones[contract.currentMilestoneIndex] ? (
                  <Typography>
                    {contract.milestones[contract.currentMilestoneIndex].title}{" "}
                    <Typography
                      component="span"
                      color="primary"
                      variant="body2"
                    >
                      (Current)
                    </Typography>
                  </Typography>
                ) : (
                  <Typography color="text.secondary">
                    No active milestone found
                  </Typography>
                )}
              </Box>

              {/* Hidden field for the form value */}
              <Controller
                name="milestoneIdx"
                control={control}
                defaultValue={
                  contract.currentMilestoneIndex !== undefined
                    ? contract.currentMilestoneIndex.toString()
                    : null
                }
                render={({ field }) => (
                  <input type="hidden" {...field} value={field.value || ""} />
                )}
              />
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Revision request details */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
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
            <Controller
              name="description"
              control={control}
              rules={{
                required:
                  "Please provide a description of the revision you need",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Revision Description"
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="Describe the changes you need..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  disabled={
                    isSubmitting ||
                    (!revisionInfo.isFree && !revisionInfo.isPaid)
                  }
                />
              )}
            />
          </Box>

          {/* Reference images */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reference Images (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Maximum 5 images. Accepted formats: JPEG, PNG, GIF
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoAlternateIcon />}
                disabled={
                  isSubmitting ||
                  (!revisionInfo.isFree && !revisionInfo.isPaid) ||
                  files.length >= 5
                }
                sx={{ mt: 1 }}
              >
                Add Images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={
                    isSubmitting ||
                    (!revisionInfo.isFree && !revisionInfo.isPaid) ||
                    files.length >= 5
                  }
                />
              </Button>
              {files.length > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {files.length}/5 images selected
                </Typography>
              )}
            </Box>

            {previewUrls.length > 0 && (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {previewUrls.map((url, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Box sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={url}
                        alt={`Preview ${index}`}
                        sx={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 1,
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeFile(index)}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          bgcolor: "rgba(255,255,255,0.7)",
                          "&:hover": {
                            bgcolor: "rgba(255,255,255,0.9)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
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
          </Stack>
        </form>
      )}
    </Paper>
  );
}
