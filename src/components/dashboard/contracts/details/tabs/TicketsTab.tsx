// src/components/dashboard/contracts/tabs/TicketsTab.tsx
import React from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import {
  CancelOutlined,
  EditOutlined,
  SwapHorizontalCircleOutlined,
  GavelOutlined,
  ConfirmationNumberOutlined,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";

// Indonesian translations
const TRANSLATIONS = {
  contractTickets: "Tiket Kontrak",
  cancellation: "Pembatalan",
  revision: "Revisi",
  change: "Perubahan",
  resolution: "Resolusi",
  viewAllTickets: "Lihat Semua Tiket",
  noTicketsFound: "Tidak ada tiket ditemukan",
};

interface TicketsTabProps {
  contract: IContract;
  username: string;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ contract, username }) => {
  const theme = useTheme();

  // Get ticket counts
  const cancelCount = contract.cancelTickets?.length || 0;
  const revisionCount = contract.revisionTickets?.length || 0;
  const changeCount = contract.changeTickets?.length || 0;
  const resolutionCount = contract.resolutionTickets?.length || 0;
  const totalCount =
    cancelCount + revisionCount + changeCount + resolutionCount;

  // Ticket type styling configuration
  const ticketTypes = [
    {
      label: TRANSLATIONS.cancellation,
      count: cancelCount,
      icon: <CancelOutlined fontSize="small" />,
      color: "error",
      bgColor: theme.palette.error.light,
    },
    {
      label: TRANSLATIONS.revision,
      count: revisionCount,
      icon: <EditOutlined fontSize="small" />,
      color: "primary",
      bgColor: theme.palette.primary.light,
    },
    {
      label: TRANSLATIONS.change,
      count: changeCount,
      icon: <SwapHorizontalCircleOutlined fontSize="small" />,
      color: "info",
      bgColor: theme.palette.info.light,
    },
    {
      label: TRANSLATIONS.resolution,
      count: resolutionCount,
      icon: <GavelOutlined fontSize="small" />,
      color: "warning",
      bgColor: theme.palette.warning.light,
    },
  ];

  return (
    <Box>
      {/* Header with view all button */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          variant="h6"
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          <ConfirmationNumberOutlined
            sx={{
              mr: 1,
              fontSize: 20,
              color: theme.palette.primary.main,
            }}
          />
          {TRANSLATIONS.contractTickets}
        </Typography>

        <Link
          href={`/${username}/dashboard/contracts/${contract._id}/tickets`}
          passHref
        >
          <Button
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            {TRANSLATIONS.viewAllTickets}
          </Button>
        </Link>
      </Box>

      {/* Ticket counts display */}
      {totalCount === 0 ? (
        <Typography color="text.secondary" sx={{ fontStyle: "italic", mt: 1 }}>
          {TRANSLATIONS.noTicketsFound}
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {ticketTypes.map(
            (type, index) =>
              type.count > 0 && (
                <Grid item xs={6} key={index}>
                  <Link
                    href={`/${username}/dashboard/contracts/${contract._id}/tickets`}
                    passHref
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "5px",
                          height: "100%",
                          backgroundColor: `${type.bgColor}`,
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Box
                          sx={{
                            mr: 1,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {type.icon}
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                        >
                          {type.label}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center">
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{ ml: 0.5 }}
                        >
                          {type.count}
                        </Typography>
                      </Box>
                    </Paper>
                  </Link>
                </Grid>
              )
          )}
        </Grid>
      )}
    </Box>
  );
};

export default TicketsTab;
