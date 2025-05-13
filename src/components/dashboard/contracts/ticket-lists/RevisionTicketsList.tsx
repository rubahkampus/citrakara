import React from "react";
import { Typography, Chip, Box } from "@mui/material";
import TicketListTemplate from "./TicketListTemplate";

interface RevisionTicketsListProps {
  tickets: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const RevisionTicketsList: React.FC<RevisionTicketsListProps> = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}) => {
  const renderTicketContent = (ticket: any) => (
    <>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Description: {ticket.description?.substring(0, 100)}
        {ticket.description?.length > 100 ? "..." : ""}
      </Typography>

      <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {ticket.paidFee && (
          <Chip
            size="small"
            label={`Paid: ${ticket.paidFee}`}
            color="success"
          />
        )}

        {ticket.milestoneIdx !== undefined && (
          <Chip
            size="small"
            label={`Milestone: ${ticket.milestoneIdx + 1}`}
            color="info"
            variant="outlined"
          />
        )}
      </Box>

      {ticket.resolvedAt && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, fontSize: "0.75rem" }}
        >
          Resolved: {formatDate(ticket.resolvedAt)}
        </Typography>
      )}
    </>
  );

  return (
    <TicketListTemplate
      tickets={tickets.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )}
      username={username}
      contractId={contractId}
      ticketType="revision"
      formatDate={formatDate}
      getStatusColor={getStatusColor}
      renderTicketContent={renderTicketContent}
      emptyMessage="No revision tickets found"
      titleFormatter={() => "Revision Request"}
    />
  );
};

export default RevisionTicketsList;
