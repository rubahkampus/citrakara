import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import TicketListTemplate from "./TicketListTemplate";

interface AllTicketsListProps {
  tickets: {
    cancel: any[];
    revision: any[];
    change: any[];
    resolution: any[];
  };
  username: string;
  contractId: string;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const AllTicketsList: React.FC<AllTicketsListProps> = ({
  tickets,
  username,
  contractId,
  formatDate,
  getStatusColor,
}) => {
  const allTickets = [
    ...tickets.cancel.map((ticket: any) => ({ ...ticket, type: "cancel" })),
    ...tickets.revision.map((ticket: any) => ({ ...ticket, type: "revision" })),
    ...tickets.change.map((ticket: any) => ({ ...ticket, type: "change" })),
    ...tickets.resolution.map((ticket: any) => ({
      ...ticket,
      type: "resolution",
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Define ticket type colors for visual distinction
  const getTypeColor = (
    type: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "success"
    | "warning"
    | "info" => {
    const typeColorMap: Record<
      string,
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "success"
      | "warning"
      | "info"
    > = {
      cancel: "error",
      revision: "primary",
      change: "info",
      resolution: "warning",
    };
    return typeColorMap[type] || "default";
  };

  const renderTicketContent = (ticket: any) => (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Chip
          size="small"
          label={ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}
          color={getTypeColor(ticket.type)}
          variant="outlined"
          sx={{ mr: 1 }}
        />
      </Box>

      {ticket.type === "cancel" && (
        <Typography variant="body2">
          Requested by: {ticket.requestedBy}
          {ticket.reason && (
            <>
              <br />
              Reason: {ticket.reason?.substring(0, 80)}
              {ticket.reason?.length > 80 ? "..." : ""}
            </>
          )}
        </Typography>
      )}

      {ticket.type === "revision" && (
        <Typography variant="body2" noWrap>
          {ticket.description?.substring(0, 100)}
          {ticket.description?.length > 100 ? "..." : ""}
        </Typography>
      )}

      {ticket.type === "change" && (
        <Typography variant="body2" noWrap>
          {ticket.reason?.substring(0, 100)}
          {ticket.reason?.length > 100 ? "..." : ""}
        </Typography>
      )}

      {ticket.type === "resolution" && (
        <Typography variant="body2">
          Target: {ticket.targetType}, Submitted by: {ticket.submittedBy}
        </Typography>
      )}

      {ticket.resolvedAt && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, fontSize: "0.75rem" }}
        >
          Resolved: {formatDate(ticket.resolvedAt)}
        </Typography>
      )}
    </Box>
  );

  const titleFormatter = (type: string) => {
    switch (type) {
      case "cancel":
        return "Cancellation Request";
      case "revision":
        return "Revision Request";
      case "change":
        return "Change Request";
      case "resolution":
        return "Resolution";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <TicketListTemplate
      tickets={allTickets}
      username={username}
      contractId={contractId}
      ticketType="ticket" // This will be overridden by each ticket's type
      formatDate={formatDate}
      getStatusColor={getStatusColor}
      renderTicketContent={renderTicketContent}
      emptyMessage="No tickets found for this contract"
      titleFormatter={titleFormatter}
    />
  );
};

export default AllTicketsList;
