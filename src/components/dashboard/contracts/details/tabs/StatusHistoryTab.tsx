// src/components/dashboard/contracts/tabs/StatusHistoryTab.tsx
import React from "react";
import { Box, Typography } from "@mui/material";

interface StatusEntry {
  event: string;
  at: string | Date;
}

interface StatusHistoryTabProps {
  statusHistory: StatusEntry[];
}

const StatusHistoryTab: React.FC<StatusHistoryTabProps> = ({
  statusHistory,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Status History
      </Typography>
      {statusHistory.map((entry, index) => (
        <Box
          key={index}
          mb={1}
          pb={1}
          borderBottom={
            index < statusHistory.length - 1 ? "1px solid #eee" : "none"
          }
        >
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">{entry.event}</Typography>
            <Typography variant="body2" color="textSecondary">
              {new Date(entry.at).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default StatusHistoryTab;
