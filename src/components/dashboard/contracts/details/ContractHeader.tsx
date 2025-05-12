// src/components/dashboard/contracts/ContractHeader.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractStatusBadge from "../ContractStatusBadge";

interface ContractHeaderProps {
  contract: IContract;
}

const ContractHeader: React.FC<ContractHeaderProps> = ({ contract }) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
    >
      <Typography variant="h5">Contract Details</Typography>
      <ContractStatusBadge status={contract.status} />
    </Box>
  );
};

export default ContractHeader;
