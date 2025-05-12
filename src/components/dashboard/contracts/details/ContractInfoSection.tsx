// src/components/dashboard/contracts/ContractInfoSection.tsx
import React from "react";
import { Box, Grid } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractInfoTable from "./ContractInfoTable";
import ContractFinancialsTable from "./ContractFinancialsTable";
import ContractActionButtons from "../ContractActionButtons";

interface ContractInfoSectionProps {
  contract: IContract;
  isArtist: boolean;
  isClient: boolean;
  username: string;
}

const ContractInfoSection: React.FC<ContractInfoSectionProps> = ({
  contract,
  isArtist,
  isClient,
  username,
}) => {
  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ContractInfoTable contract={contract} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ContractFinancialsTable finance={contract.finance} />
        </Grid>
      </Grid>

      <Box mt={3}>
        <ContractActionButtons
          username={username}
          contract={contract}
          isArtist={isArtist}
          isClient={isClient}
        />
      </Box>
    </>
  );
};

export default ContractInfoSection;
