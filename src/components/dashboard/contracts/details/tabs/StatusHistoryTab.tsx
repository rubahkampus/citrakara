// src/components/dashboard/contracts/tabs/StatusHistoryTab.tsx
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  Stack,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Edit as EditIcon,
  AttachMoney as AttachMoneyIcon,
  ReceiptLong as ReceiptLongIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";

/**
 * Represents a single status history entry
 */
interface StatusEntry {
  event: string;
  at: string | Date;
}

/**
 * Props for StatusHistoryTab component
 */
interface StatusHistoryTabProps {
  statusHistory: StatusEntry[];
}

/**
 * StatusHistoryTab component displays a history of contract status changes
 */
const StatusHistoryTab: React.FC<StatusHistoryTabProps> = ({
  statusHistory,
}) => {
  /**
   * Formats date to Indonesian locale
   */
  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Helper function to get description for complex statuses
   */
  const getStatusDescription = (status: string): string => {
    switch (status) {
      case "active":
        return "Kontrak aktif dan sedang berlangsung";
      case "completed":
        return "Kontrak selesai dengan pembayaran penuh kepada seniman";
      case "completedLate":
        return "Kontrak selesai terlambat. Seniman menerima total dikurangi penalti keterlambatan";
      case "cancelledClient":
        return "Dibatalkan oleh klien. Seniman menerima persentase pekerjaan + biaya pembatalan";
      case "cancelledClientLate":
        return "Dibatalkan oleh klien terlambat. Tidak ada biaya pembatalan untuk klien";
      case "cancelledArtist":
        return "Dibatalkan oleh seniman. Seniman menerima persentase pekerjaan dikurangi biaya pembatalan";
      case "cancelledArtistLate":
        return "Dibatalkan oleh seniman terlambat. Seniman dikenakan biaya pembatalan dan penalti keterlambatan";
      case "notCompleted":
        return "Kontrak tidak selesai. Klien menerima pengembalian dana penuh";
      default:
        return "";
    }
  };

  /**
   * Translates event status to Indonesian
   */
  const translateEvent = (event: string): string => {
    const translations: Record<string, string> = {
      // Contract creation and standard events
      "Contract Created": "Kontrak Dibuat",
      "Contract Accepted": "Kontrak Diterima",
      "Payment Requested": "Pembayaran Diminta",
      "Payment Completed": "Pembayaran Selesai",
      "Work Started": "Pekerjaan Dimulai",
      "Work Completed": "Pekerjaan Selesai",
      "Contract Amended": "Kontrak Diubah",
      "Revision Requested": "Revisi Diminta",
      "Revision Submitted": "Revisi Diserahkan",

      // Specific contract statuses
      active: "Aktif",
      completed: "Selesai",
      completedLate: "Selesai Terlambat",
      cancelledClient: "Dibatalkan oleh Klien",
      cancelledClientLate: "Dibatalkan oleh Klien (Terlambat)",
      cancelledArtist: "Dibatalkan oleh Seniman",
      cancelledArtistLate: "Dibatalkan oleh Seniman (Terlambat)",
      notCompleted: "Tidak Selesai",
    };

    return translations[event] || event;
  };

  /**
   * Determines the appropriate icon for a status event
   */
  const getEventIcon = (event: string) => {
    const eventLower = event.toLowerCase();

    if (
      eventLower.includes("created") ||
      eventLower.includes("amended") ||
      eventLower === "active"
    ) {
      return <EditIcon />;
    } else if (eventLower.includes("payment")) {
      return <AttachMoneyIcon />;
    } else if (eventLower.includes("completed")) {
      return <CheckCircleIcon />;
    } else if (
      eventLower.includes("revision") ||
      eventLower.includes("requested")
    ) {
      return <PendingIcon />;
    } else if (
      eventLower.includes("cancelled") ||
      eventLower === "notcompleted"
    ) {
      return <ReceiptLongIcon />;
    } else {
      return <HistoryIcon />;
    }
  };

  /**
   * Determines avatar background color based on the event type
   */
  const getAvatarColor = (event: string): string => {
    const eventLower = event.toLowerCase();

    if (eventLower === "completed") {
      return "#4caf50"; // success - green
    } else if (eventLower === "completedlate") {
      return "#8bc34a"; // light green
    } else if (
      eventLower.includes("cancelled") ||
      eventLower === "notcompleted"
    ) {
      return "#f44336"; // error - red
    } else if (
      eventLower.includes("revision") ||
      eventLower.includes("requested")
    ) {
      return "#ff9800"; // warning - orange
    } else if (eventLower.includes("payment") || eventLower === "active") {
      return "#2196f3"; // info - blue
    } else {
      return "#3f51b5"; // primary - indigo
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
          fontWeight: "medium",
        }}
      >
        <HistoryIcon sx={{ mr: 1 }} /> Riwayat Status
      </Typography>

      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: "background.default",
        }}
      >
        {statusHistory.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
          >
            Belum ada riwayat status
          </Typography>
        ) : (
          <Stack spacing={2}>
            {statusHistory.map((entry, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(entry.event),
                      mr: 2,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getEventIcon(entry.event)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {translateEvent(entry.event)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(entry.at)}
                    </Typography>

                    {/* Status description for complex statuses */}
                    {getStatusDescription(entry.event) && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          color: "text.secondary",
                          fontSize: "0.875rem",
                          bgcolor: "background.paper",
                          p: 1,
                          borderRadius: 1,
                          borderLeft: "3px solid",
                          borderColor: getAvatarColor(entry.event),
                        }}
                      >
                        {getStatusDescription(entry.event)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {index < statusHistory.length - 1 && (
                  <Divider
                    sx={{
                      my: 1,
                      ml: "18px", // Half of avatar width to align with avatar center
                      borderStyle: "dashed",
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default StatusHistoryTab;
