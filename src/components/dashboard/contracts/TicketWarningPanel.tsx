// src/components/dashboard/contracts/tickets/TicketWarningPanel.tsx
import React from "react";
import { Box, Alert, Typography, Paper } from "@mui/material";

interface Warning {
  type: "error" | "warning" | "info" | "success";
  message: string;
}

interface TicketWarningPanelProps {
  warnings: Warning[];
  ticketType: string;
}

const TicketWarningPanel: React.FC<TicketWarningPanelProps> = ({
  warnings,
  ticketType,
}) => {
  // Check if there's a blocker error that should prevent form display
  const hasBlockingError = warnings.some(
    (warning) =>
      warning.type === "error" &&
      ((ticketType === "cancel" && warning.message.includes("cancellation")) ||
        (ticketType === "revision" && warning.message.includes("revision")) ||
        (ticketType === "change" && warning.message.includes("change")) ||
        (ticketType === "resolution" && warning.message.includes("resolution")))
  );

  if (warnings.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      {warnings.map((warning, index) => (
        <Alert key={index} severity={warning.type} sx={{ mb: 1 }}>
          {warning.message}
        </Alert>
      ))}

      {hasBlockingError && (
        <Paper sx={{ p: 3, mt: 2, bgcolor: "#f5f5f5" }}>
          <Typography variant="body1" color="error">
            You cannot create a new {ticketType} ticket at this time. Please
            address the issues mentioned above first.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TicketWarningPanel;
