// src/components/dashboard/contracts/tickets/ChangeTicketForm.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useRouter } from "next/navigation";
import { IContract } from "@/lib/db/models/contract.model";

interface ChangeTicketFormProps {
  contract: IContract;
  userId: string;
  isClient: boolean;
}

export default function ChangeTicketForm({
  contract,
  userId,
  isClient,
}: ChangeTicketFormProps) {
  const router = useRouter();

  // Form state
  const [reason, setReason] = useState("");
  const [generalDescription, setGeneralDescription] = useState("");
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Change sections to include
  const [includeDeadline, setIncludeDeadline] = useState(false);
  const [includeDescription, setIncludeDescription] = useState(false);
  const [includeGeneralOptions, setIncludeGeneralOptions] = useState(false);
  const [includeSubjectOptions, setIncludeSubjectOptions] = useState(false);

  // Process status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get allowed change types from contract
  const allowedChanges =
    contract.proposalSnapshot.listingSnapshot?.changeable || [];

  // Check if changes are allowed
  const isChangeAllowed =
    contract.proposalSnapshot.listingSnapshot?.allowContractChange || false;

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
      if (!reason.trim()) {
        throw new Error("Please provide a reason for the requested changes");
      }

      // Check that at least one change is included
      if (
        !includeDeadline &&
        !includeDescription &&
        !includeGeneralOptions &&
        !includeSubjectOptions
      ) {
        throw new Error(
          "Please select at least one aspect of the contract to change"
        );
      }

      // Check that each included change has necessary data
      if (includeDeadline && !deadlineAt) {
        throw new Error("Please select a new deadline date");
      }

      if (includeDescription && !generalDescription.trim()) {
        throw new Error("Please provide a new description");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("reason", reason);

      if (includeDeadline && deadlineAt) {
        formData.append("deadlineAt", deadlineAt.toISOString());
      }

      if (includeDescription) {
        formData.append("generalDescription", generalDescription);
      }

      // For simplicity in this example, we're not handling the complex
      // structure of generalOptions and subjectOptions. In a real app,
      // you'd need UI for selecting these options and proper JSON handling.

      // If including general options
      if (includeGeneralOptions) {
        formData.append("generalOptions", JSON.stringify({}));
      }

      // If including subject options
      if (includeSubjectOptions) {
        formData.append("subjectOptions", JSON.stringify([]));
      }

      // Add reference images
      files.forEach((file) => {
        formData.append("referenceImages[]", file);
      });

      // Submit to API
      const response = await fetch(
        `/api/contract/${contract._id}/tickets/change/new`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create change request");
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

  // Check if contract changes are allowed
  if (!isChangeAllowed) {
    return (
      <Alert severity="error">This contract does not allow changes.</Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Contract change request submitted successfully! Redirecting...
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
              Change Request Information
            </Typography>
            <Typography variant="body2">
              You can request changes to certain aspects of the contract. The
              artist will need to approve these changes and may apply a fee for
              significant modifications.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Alert severity="info">
              <Typography variant="body2" fontWeight="bold">
                Changeable Aspects:
              </Typography>
              <Typography variant="body2">
                {allowedChanges.length > 0
                  ? allowedChanges.join(", ")
                  : "No specific aspects are listed as changeable. Contact the artist directly."}
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Reason for change */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Reason for Changes
            </Typography>
            <TextField
              label="Reason"
              multiline
              rows={3}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need these changes..."
              required
              disabled={isSubmitting}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Change options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
              Select Changes to Request
            </Typography>
            <FormGroup>
              {allowedChanges.includes("deadline") && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeDeadline}
                      onChange={(e) => setIncludeDeadline(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Change deadline"
                />
              )}

              {allowedChanges.includes("generalDescription") && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeDescription}
                      onChange={(e) => setIncludeDescription(e.target.checked)}
                      disabled={isSubmitting}
                    />
                  }
                  label="Change general description"
                />
              )}

              {allowedChanges.includes("generalOptions") && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeGeneralOptions}
                      onChange={(e) =>
                        setIncludeGeneralOptions(e.target.checked)
                      }
                      disabled={isSubmitting}
                    />
                  }
                  label="Change general options"
                />
              )}

              {allowedChanges.includes("subjectOptions") && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeSubjectOptions}
                      onChange={(e) =>
                        setIncludeSubjectOptions(e.target.checked)
                      }
                      disabled={isSubmitting}
                    />
                  }
                  label="Change subject options"
                />
              )}
            </FormGroup>
          </Box>

          {/* Deadline change section */}
          {includeDeadline && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                New Deadline
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="New Deadline Date"
                  value={deadlineAt}
                  onChange={(newValue) => setDeadlineAt(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={new Date()}
                  disabled={isSubmitting}
                />
              </LocalizationProvider>
            </Box>
          )}

          {/* Description change section */}
          {includeDescription && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                New General Description
              </Typography>
              <TextField
                label="Description"
                multiline
                rows={4}
                fullWidth
                value={generalDescription}
                onChange={(e) => setGeneralDescription(e.target.value)}
                placeholder="Enter new description..."
                required={includeDescription}
                disabled={isSubmitting}
              />
            </Box>
          )}

          {/* General options change section - simplified */}
          {includeGeneralOptions && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                General Options Changes
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  In a production version, this would include UI for modifying
                  general options. For this simplified version, you are
                  requesting to change general options but not specifying the
                  exact changes.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Subject options change section - simplified */}
          {includeSubjectOptions && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Subject Options Changes
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  In a production version, this would include UI for modifying
                  subject options. For this simplified version, you are
                  requesting to change subject options but not specifying the
                  exact changes.
                </Typography>
              </Alert>
            </Box>
          )}

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
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              "Submit Change Request"
            )}
          </Button>
        </form>
      )}
    </Paper>
  );
}
