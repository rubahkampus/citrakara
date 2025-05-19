// src/components/dashboard/contracts/ContractDetailsPage.tsx
"use client";

import React, { useMemo } from "react";
import { Box, Paper, useTheme } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractHeader from "./details/ContractHeader";
import ContractInfoSection from "./details/ContractInfoSection";
import ContractTabsSection from "./details/ContractTabsSection";
import MilestonesList from "./details/MilestonesList";

// Types
interface ContractDetailsPageProps {
  username: string;
  contract: IContract;
  userId: string;
}

// Component Wrappers
const SectionPaper: React.FC<{
  children: React.ReactNode;
  sx?: Record<string, any>;
}> = ({ children, sx = {} }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          boxShadow: "0 4px 15px rgba(0,0,0,0.07)",
        },
        ...sx,
      }}
      elevation={1}
    >
      {children}
    </Paper>
  );
};

// Main Component
const ContractDetailsPage: React.FC<ContractDetailsPageProps> = ({
  username,
  contract,
  userId,
}) => {
  // Memoize user roles to avoid recalculations
  const { isArtist, isClient } = useMemo(
    () => ({
      isArtist: contract.artistId.toString() === userId,
      isClient: contract.clientId.toString() === userId,
    }),
    [contract.artistId, contract.clientId, userId]
  );

  // Check if this is a milestone-based contract
  const isMilestoneFlow =
    contract.proposalSnapshot.listingSnapshot.flow === "milestone";

  return (
    <Box
      sx={{
        py: 4,
        maxWidth: "100%",
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* Contract Header & Info Section */}
      <SectionPaper>
        <ContractHeader contract={contract} username={username} />
        <ContractInfoSection
          contract={contract}
          isArtist={isArtist}
          isClient={isClient}
          username={username}
        />
      </SectionPaper>

      {/* Contract Tabs Section */}
      <SectionPaper sx={{ p: 0 }}>
        <ContractTabsSection contract={contract} username={username} />
      </SectionPaper>

      {/* Milestone section, only shown for milestone-flow contracts */}
      {isMilestoneFlow && contract.milestones && (
        <SectionPaper>
          <MilestonesList milestones={contract.milestones} />
        </SectionPaper>
      )}
    </Box>
  );
};

export default ContractDetailsPage;
