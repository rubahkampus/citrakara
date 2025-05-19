import React from "react";
import { Box, Grid, Typography, Divider } from "@mui/material";
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

/**
 * Component to display contract information, price details and action buttons
 */
const ContractInfoSection: React.FC<ContractInfoSectionProps> = ({
  contract,
  isArtist,
  isClient,
  username,
}) => {
  // Common styles for section headers
  const sectionHeaderStyle = {
    fontWeight: "medium",
  };

  // Define section data for easy maintenance
  const sections = [
    {
      id: "contract-info",
      title: "Informasi Kontrak",
      component: <ContractInfoTable contract={contract} />,
    },
    {
      id: "price-details",
      title: "Detail Harga",
      component: <ContractFinancialsTable finance={contract.finance} />,
    },
  ];

  return (
    <>
      <Grid container spacing={3}>
        {sections.map((section) => (
          <Grid item xs={12} md={6} key={section.id}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={sectionHeaderStyle}
            >
              {section.title}
            </Typography>
            {section.component}
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="subtitle1" gutterBottom sx={sectionHeaderStyle}>
          Aksi
        </Typography>
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
