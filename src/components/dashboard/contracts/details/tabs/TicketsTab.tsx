// src/components/dashboard/contracts/tabs/TicketsTab.tsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";

interface TicketsTabProps {
  contract: IContract;
  username: string;
}

const TicketsTab: React.FC<TicketsTabProps> = ({ contract, username }) => {
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Tickets</Typography>
        <Link
          href={`/${username}/dashboard/contracts/${contract._id}/tickets`}
          passHref
        >
          <Button size="small" variant="outlined">
            View All Tickets
          </Button>
        </Link>
      </Box>

      {contract.cancelTickets?.length === 0 &&
      contract.revisionTickets?.length === 0 &&
      contract.changeTickets?.length === 0 &&
      contract.resolutionTickets?.length === 0 ? (
        <Typography color="textSecondary">No tickets found</Typography>
      ) : (
        <Box>
          {contract.cancelTickets?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Cancellation Tickets
              </Typography>
              <Typography>{contract.cancelTickets.length} ticket(s)</Typography>
            </Box>
          )}

          {contract.revisionTickets?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Revision Tickets
              </Typography>
              <Typography>
                {contract.revisionTickets.length} ticket(s)
              </Typography>
            </Box>
          )}

          {contract.changeTickets?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Change Tickets
              </Typography>
              <Typography>{contract.changeTickets.length} ticket(s)</Typography>
            </Box>
          )}

          {contract.resolutionTickets?.length > 0 && (
            <Box mb={2}>
              <Typography fontWeight="bold" gutterBottom>
                Resolution Tickets
              </Typography>
              <Typography>
                {contract.resolutionTickets.length} ticket(s)
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TicketsTab;
