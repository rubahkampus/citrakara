import React from "react";
import { Typography, Box, Chip } from "@mui/material";
import TicketListTemplate from "./TicketListTemplate";

interface ResolutionTicketsListProps {
  tickets: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const ResolutionTicketsList: React.FC<ResolutionTicketsListProps> = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}) => {
  const renderTicketContent = (ticket: any) => (
    <>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Submitted by: {ticket.submittedBy}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <Typography variant="body2" component="span">
          Target:
        </Typography>
        <Chip
          size="small"
          label={`${ticket.targetType} #${ticket.targetId?.toString()}`}
          color="info"
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Box>

      {ticket.decision && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">Decision: {ticket.decision}</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: "0.75rem" }}
          >
            Resolved: {formatDate(ticket.resolvedAt)}
          </Typography>
        </Box>
      )}
    </>
  );

  return (
    <TicketListTemplate
      tickets={tickets}
      username={username}
      contractId={contractId}
      ticketType="resolution"
      formatDate={formatDate}
      getStatusColor={getStatusColor}
      renderTicketContent={renderTicketContent}
      emptyMessage="No resolution tickets found"
      titleFormatter={() => "Resolution"}
    />
  );
};

export default ResolutionTicketsList;
