import React from "react";
import { Typography } from "@mui/material";
import TicketListTemplate from "./TicketListTemplate";

interface CancelTicketsListProps {
  tickets: any[];
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const CancelTicketsList: React.FC<CancelTicketsListProps> = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}) => {
  const renderTicketContent = (ticket: any) => (
    <>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Requested by: {ticket.requestedBy}
      </Typography>

      <Typography variant="body2" sx={{ mb: 0.5 }}>
        Reason: {ticket.reason?.substring(0, 100)}
        {ticket.reason?.length > 100 ? "..." : ""}
      </Typography>

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
      ticketType="cancel"
      formatDate={formatDate}
      getStatusColor={getStatusColor}
      renderTicketContent={renderTicketContent}
      emptyMessage="No cancellation tickets found"
      titleFormatter={() => "Cancellation Request"}
    />
  );
};

export default CancelTicketsList;
