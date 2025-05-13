import React from "react";
import { Typography, Chip, Box } from "@mui/material";
import TicketListTemplate from "./TicketListTemplate";

interface ChangeTicketsListProps {
  tickets: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const ChangeTicketsList: React.FC<ChangeTicketsListProps> = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}) => {
  const renderTicketContent = (ticket: any) => (
    <>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Reason: {ticket.reason?.substring(0, 100)}
        {ticket.reason?.length > 100 ? "..." : ""}
      </Typography>

      <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {ticket.isPaidChange && (
          <Chip
            size="small"
            label={`Fee: ${ticket.paidFee || "Pending"}`}
            color="info"
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
      tickets={tickets}
      username={username}
      contractId={contractId}
      ticketType="change"
      formatDate={formatDate}
      getStatusColor={getStatusColor}
      renderTicketContent={renderTicketContent}
      emptyMessage="No change tickets found"
      titleFormatter={() => "Change Request"}
    />
  );
};

export default ChangeTicketsList;
