// src/components/dashboard/contracts/ContractDetailsPage.tsx
"use client";

import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractHeader from "./details/ContractHeader";
import ContractInfoSection from "./details/ContractInfoSection";
import ContractTabsSection from "./details/ContractTabsSection";
import MilestonesList from "./details/MilestonesList";

interface ContractDetailsPageProps {
  username: string;
  contract: IContract;
  userId: string;
}

const ContractDetailsPage: React.FC<ContractDetailsPageProps> = ({
  username,
  contract,
  userId,
}) => {
  const isArtist = contract.artistId.toString() === userId;
  const isClient = contract.clientId.toString() === userId;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <ContractHeader contract={contract} />
        <ContractInfoSection
          contract={contract}
          isArtist={isArtist}
          isClient={isClient}
          username={username}
        />
      </Paper>

      <Paper sx={{ mb: 3 }} elevation={1}>
        <ContractTabsSection contract={contract} username={username} />
      </Paper>

      {/* Milestone section, only shown for milestone-flow contracts */}
      {contract.proposalSnapshot.listingSnapshot.flow === "milestone" && (
        <Paper sx={{ p: 3 }} elevation={1}>
          <MilestonesList milestones={contract.milestones} />
        </Paper>
      )}
    </Box>
  );
};

export default ContractDetailsPage;
