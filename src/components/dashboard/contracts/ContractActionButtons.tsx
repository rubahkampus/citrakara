// src/components/dashboard/contracts/ContractActionButtons.tsx
'use client'

import React from "react";
import { Box, Button, Stack } from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";

interface ContractActionButtonsProps {
  username: string;
  contract: IContract;
  isArtist: boolean;
  isClient: boolean;
}

const ContractActionButtons: React.FC<ContractActionButtonsProps> = ({
  username,
  contract,
  isArtist,
  isClient,
}) => {
  const isActive = contract.status === "active";
  const isTerminal = [
    "completed",
    "completedLate",
    "cancelledClient",
    "cancelledClientLate",
    "cancelledArtist",
    "cancelledArtistLate",
    "notCompleted",
  ].includes(contract.status);

  const contractId = contract._id.toString();

  // Check if client can claim funds
  const canClientClaimFunds =
    isClient && isTerminal && contract.finance.totalOwnedByClient > 0;

  // Check if artist can claim funds
  const canArtistClaimFunds =
    isArtist && isTerminal && contract.finance.totalOwnedByArtist > 0;

  // Check if artist can upload
  const canArtistUpload = isArtist && isActive;

  // Check if client can create tickets
  const canClientCreateTickets = isClient && isActive;

  // Check if artist can create tickets
  const canArtistCreateTickets = isArtist && isActive;

  // Flow is milestone
  const isMilestoneFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "milestone";

  // Flow is standard
  const isStandardFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "standard";

  return (
    <Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {/* Claim funds buttons */}
        {canClientClaimFunds && (
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/claim?role=client`}
            passHref
          >
            <Button size="small" variant="contained" color="primary">
              Claim Refund ({contract.finance.totalOwnedByClient})
            </Button>
          </Link>
        )}

        {canArtistClaimFunds && (
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/claim?role=artist`}
            passHref
          >
            <Button size="small" variant="contained" color="primary">
              Claim Payment ({contract.finance.totalOwnedByArtist})
            </Button>
          </Link>
        )}

        {/* Artist upload buttons */}
        {canArtistUpload && isStandardFlow && (
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/uploads/progress/new`}
            passHref
          >
            <Button size="small" variant="outlined">
              Upload Progress
            </Button>
          </Link>
        )}

        {canArtistUpload && isMilestoneFlow && (
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/uploads/milestone/new?milestoneIdx=${contract.currentMilestoneIndex}`}
            passHref
          >
            <Button size="small" variant="outlined">
              Upload Milestone Progress
            </Button>
          </Link>
        )}

        {canArtistUpload && (
          <Link
            href={`/${username}/dashboard/contracts/${contractId}/uploads/final/new`}
            passHref
          >
            <Button size="small" variant="outlined">
              Upload Final Delivery
            </Button>
          </Link>
        )}

        {/* Client ticket buttons */}
        {canClientCreateTickets && (
          <>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
              passHref
            >
              <Button size="small" variant="outlined" color="error">
                Request Cancellation
              </Button>
            </Link>

            {contract.proposalSnapshot.listingSnapshot.revisions?.type !==
              "none" && (
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/revision/new`}
                passHref
              >
                <Button size="small" variant="outlined">
                  Request Revision
                </Button>
              </Link>
            )}

            {contract.proposalSnapshot.listingSnapshot.allowContractChange && (
              <Link
                href={`/${username}/dashboard/contracts/${contractId}/tickets/change/new`}
                passHref
              >
                <Button size="small" variant="outlined">
                  Request Contract Change
                </Button>
              </Link>
            )}

            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
              passHref
            >
              <Button size="small" variant="outlined" color="warning">
                Open Dispute
              </Button>
            </Link>
          </>
        )}

        {/* Artist ticket buttons */}
        {canArtistCreateTickets && (
          <>
            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/cancel/new`}
              passHref
            >
              <Button size="small" variant="outlined" color="error">
                Request Cancellation
              </Button>
            </Link>

            <Link
              href={`/${username}/dashboard/contracts/${contractId}/tickets/resolution/new`}
              passHref
            >
              <Button size="small" variant="outlined" color="warning">
                Open Dispute
              </Button>
            </Link>
          </>
        )}

        {/* View buttons */}
        <Link
          href={`/${username}/dashboard/contracts/${contractId}/tickets`}
          passHref
        >
          <Button size="small" variant="text">
            View Tickets
          </Button>
        </Link>

        <Link
          href={`/${username}/dashboard/contracts/${contractId}/uploads`}
          passHref
        >
          <Button size="small" variant="text">
            View Uploads
          </Button>
        </Link>
      </Stack>
    </Box>
  );
};

export default ContractActionButtons;
