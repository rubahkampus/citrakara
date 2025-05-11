// src/components/dashboard/contracts/tickets/ResolutionTicketForm.tsx
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
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";

interface ResolutionTicketFormProps {
  contract: IContract;
  userId: string;
  isArtist: boolean;
  isClient: boolean;
}

interface TargetItem {
  id: string;
  type: "cancel" | "revision" | "final" | "milestone";
  label: string;
  date: string;
  status: string;
}

export default function ResolutionTicketForm({
  contract,
  userId,
  isArtist,
  isClient,
}: ResolutionTicketFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we have preset params from URL
  const presetTargetType = searchParams.get("targetType") as
    | "cancel"
    | "revision"
    | "final"
    | "milestone"
    | null;
  const presetTargetId = searchParams.get("targetId");

  // Form state
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<
    "cancel" | "revision" | "final" | "milestone" | ""
  >(presetTargetType || "");
  const [targetId, setTargetId] = useState<string>(presetTargetId || "");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Available targets for resolution
  const [availableTargets, setAvailableTargets] = useState<{
    cancel: TargetItem[];
    revision: TargetItem[];
    final: TargetItem[];
    milestone: TargetItem[];
  }>({
    cancel: [],
    revision: [],
    final: [],
    milestone: [],
  });

  // Process status
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch available targets for resolution
  useEffect(() => {
    const fetchTargets = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call to fetch all possible targets
        // For now we'll simulate with contract data

        // Populate cancel tickets
        const cancelTickets: TargetItem[] = (contract.cancelTickets || []).map(
          (ticketId, index) => ({
            id: ticketId.toString(),
            type: "cancel",
            label: `Cancellation Request #${index + 1}`,
            date: new Date().toLocaleDateString(), // Ideally from actual ticket data
            status: "active", // Ideally from actual ticket data
          })
        );

        // Populate revision tickets
        const revisionTickets: TargetItem[] = (
          contract.revisionTickets || []
        ).map((ticketId, index) => ({
          id: ticketId.toString(),
          type: "revision",
          label: `Revision Request #${index + 1}`,
          date: new Date().toLocaleDateString(),
          status: "active",
        }));

        // Populate final uploads
        const finalUploads: TargetItem[] = (contract.finalUploads || []).map(
          (uploadId, index) => ({
            id: uploadId.toString(),
            type: "final",
            label: `Final Delivery #${index + 1}`,
            date: new Date().toLocaleDateString(),
            status: "active",
          })
        );

        // Populate milestone uploads
        const milestoneUploads: TargetItem[] = (
          contract.progressUploadsMilestone || []
        ).map((uploadId, index) => ({
          id: uploadId.toString(),
          type: "milestone",
          label: `Milestone Upload #${index + 1}`,
          date: new Date().toLocaleDateString(),
          status: "active",
        }));

        setAvailableTargets({
          cancel: cancelTickets,
          revision: revisionTickets,
          final: finalUploads,
          milestone: milestoneUploads,
        });
      } catch (err) {
        setError("Failed to load resolution targets");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTargets();
  }, [contract]);

  // Handle target type change
  const handleTargetTypeChange = (event: SelectChangeEvent) => {
    setTargetType(event.target.value as any);
    setTargetId(""); // Reset target ID when type changes
  };

  // Handle target ID change
  const handleTargetIdChange = (event: SelectChangeEvent) => {
    setTargetId(event.target.value);
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
        throw new Error("Please provide a detailed description of the issue");
      }

      if (!targetType) {
        throw new Error("Please select what you are disputing");
      }

      if (!targetId) {
        throw new Error("Please select the specific item you are disputing");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", description);
      formData.append("targetType", targetType);
      formData.append("targetId", targetId);

      // Add proof images
      files.forEach((file) => {
        formData.append("proofImages[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/tickets/resolution/new`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create resolution request");
      }

      setSuccess(true);

      // Redirect after successful submission
      setTimeout(() => {
        router.push(`/dashboard/${userId}/resolution`);
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

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Resolution request submitted successfully! Redirecting...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              About Resolution Requests
            </Typography>
            <Typography variant="body2">
              Resolution requests are reviewed by administrators who will
              examine both sides of the dispute and make a final decision. Both
              parties will have the opportunity to provide evidence.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              What are you disputing?
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="target-type-label">Dispute Type</InputLabel>
              <Select
                labelId="target-type-label"
                id="target-type"
                value={targetType}
                label="Dispute Type"
                onChange={handleTargetTypeChange}
                required
                disabled={isSubmitting || !!presetTargetType}
              >
                <MenuItem value="">Select what you are disputing</MenuItem>
                <MenuItem
                  value="cancel"
                  disabled={availableTargets.cancel.length === 0}
                >
                  Cancellation Request
                </MenuItem>
                <MenuItem
                  value="revision"
                  disabled={availableTargets.revision.length === 0}
                >
                  Revision Request
                </MenuItem>
                <MenuItem
                  value="final"
                  disabled={availableTargets.final.length === 0}
                >
                  Final Delivery
                </MenuItem>
                <MenuItem
                  value="milestone"
                  disabled={availableTargets.milestone.length === 0}
                >
                  Milestone Upload
                </MenuItem>
              </Select>
            </FormControl>

            {targetType && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="target-id-label">Specific Item</InputLabel>
                <Select
                  labelId="target-id-label"
                  id="target-id"
                  value={targetId}
                  label="Specific Item"
                  onChange={handleTargetIdChange}
                  required
                  disabled={isSubmitting || !!presetTargetId}
                >
                  <MenuItem value="">Select specific item</MenuItem>
                  {availableTargets[targetType].map((target) => (
                    <MenuItem key={target.id} value={target.id}>
                      {target.label} - {target.date}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Detailed description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Detailed Description
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please describe the issue in detail. Be specific about what went
              wrong and why you believe this requires administrative
              intervention.
            </Typography>

            <TextField
              label="Description"
              multiline
              rows={5}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain your dispute in detail..."
              required
              disabled={isSubmitting}
            />
          </Box>

          {/* Proof images */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Supporting Evidence
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Upload screenshots, images, or other relevant evidence to support
              your case.
            </Typography>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={isSubmitting}
              style={{ marginBottom: "16px" }}
            />

            {previewUrls.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {previewUrls.map((url, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={url}
                    alt={`Evidence ${index + 1}`}
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

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Filing a resolution request is a serious matter. Administrators
              will review all evidence from both parties before making a
              decision. Please ensure you have tried to resolve the issue
              directly with the other party first.
            </Typography>
          </Alert>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Submit Resolution Request"
            )}
          </Button>
        </form>
      )}
    </Paper>
  );
}
