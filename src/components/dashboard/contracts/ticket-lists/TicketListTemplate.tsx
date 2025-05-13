import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  Chip,
  useTheme,
} from "@mui/material";
import Link from "next/link";

interface TicketListTemplateProps {
  tickets: any[];
  username: string;
  contractId: string;
  ticketType: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  renderTicketContent: (ticket: any) => React.ReactNode;
  emptyMessage: string;
  titleFormatter?: (ticketType: string) => string;
}

const TicketListTemplate: React.FC<TicketListTemplateProps> = ({
  tickets,
  username,
  contractId,
  ticketType,
  formatDate,
  getStatusColor,
  renderTicketContent,
  emptyMessage,
  titleFormatter = (type) =>
    `${type.charAt(0).toUpperCase() + type.slice(1)} Request`,
}) => {
  const theme = useTheme();

  if (tickets.length === 0) {
    return (
      <Box
        p={3}
        textAlign="center"
        component={Paper}
        sx={{
          borderRadius: 1,
          bgcolor: "background.paper",
        }}
      >
        <Typography color="textSecondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {tickets.map((ticket: any) => (
        <Paper
          key={ticket._id.toString()}
          sx={{
            mb: 2,
            borderRadius: 1,
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[3],
            },
          }}
          elevation={1}
        >
          <ListItem
            component={Link}
            href={`/${username}/dashboard/contracts/${contractId}/tickets/${ticket.type || ticketType}/${ticket._id}`}
            sx={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              p: 2,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography
                  variant="subtitle1"
                  component="span"
                  fontWeight="bold"
                  sx={{ mr: 1 }}
                >
                  {titleFormatter(ticket.type || ticketType)}
                </Typography>
                <Chip
                  size="small"
                  label={ticket.status}
                  color={getStatusColor(ticket.status) as "default" | "primary" | "secondary" | "error" | "success" | "warning" | "info"}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                {formatDate(ticket.createdAt)}
              </Typography>
            </Box>

            {renderTicketContent(ticket)}
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default TicketListTemplate;
