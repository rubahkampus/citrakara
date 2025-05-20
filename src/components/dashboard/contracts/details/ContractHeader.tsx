// src/components/dashboard/contracts/ContractHeader.tsx
import React from "react";
import {
  Box,
  Typography,
  Divider,
  Breadcrumbs,
  Link,
  Button,
} from "@mui/material";
import { NavigateNext, Home, LocalAtm, ArrowBack } from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractStatusBadge from "../ContractStatusBadge";

interface ContractHeaderProps {
  contract: IContract;
  username: string;
}

const ContractHeader: React.FC<ContractHeaderProps> = ({
  contract,
  username,
}) => {
  // Extract common styling patterns
  const linkStyle = {
    display: "flex",
    alignItems: "center",
  };

  const iconStyle = { mr: 0.5 };

  // Extract contract ID for readability
  const contractId = contract._id.toString().substring(0, 8);

  // Extract contract title with fallback
  const contractTitle =
    contract.proposalSnapshot.listingSnapshot.title || "Detail Kontrak";

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight="medium">
            {contractTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {contractId}...
          </Typography>
        </Box>
        <ContractStatusBadge status={contract.status} />
      </Box>

      <Divider sx={{ mb: 3 }} />
    </>
  );
};

export default ContractHeader;
