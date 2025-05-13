// src/components/dashboard/contracts/ContractHeader.tsx
import React from "react";
import { Box, Typography, Divider, Breadcrumbs, Link } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ArticleIcon from "@mui/icons-material/Article";
import { IContract } from "@/lib/db/models/contract.model";
import ContractStatusBadge from "../ContractStatusBadge";
import commissionListingModel from "@/lib/db/models/commissionListing.model";

interface ContractHeaderProps {
  contract: IContract;
}

const ContractHeader: React.FC<ContractHeaderProps> = ({ contract }) => {
  return (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/dashboard/contracts"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <ArticleIcon sx={{ mr: 0.5 }} fontSize="small" />
          Contracts
        </Link>
        <Typography color="text.primary">Contract Details</Typography>
      </Breadcrumbs>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight="medium">
            {contract.proposalSnapshot.listingSnapshot.title || "Contract Details"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {contract._id.toString().substring(0, 8)}...
          </Typography>
        </Box>
        <ContractStatusBadge status={contract.status} />
      </Box>

      <Divider sx={{ mb: 3 }} />
    </>
  );
};

export default ContractHeader;
