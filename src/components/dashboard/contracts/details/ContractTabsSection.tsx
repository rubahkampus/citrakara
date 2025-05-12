// src/components/dashboard/contracts/ContractTabsSection.tsx
import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";
import ContractTermsTab from "./tabs/ContractTermsTab";
import StatusHistoryTab from "./tabs/StatusHistoryTab";
import TicketsTab from "./tabs/TicketsTab";
import UploadsTab from "./tabs/UploadsTab";

interface ContractTabsSectionProps {
  contract: IContract;
  username: string;
}

const ContractTabsSection: React.FC<ContractTabsSectionProps> = ({
  contract,
  username,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Terms" />
        <Tab label="Status History" />
        <Tab label="Tickets" />
        <Tab label="Uploads" />
      </Tabs>

      <Box p={3}>
        {tabValue === 0 && <ContractTermsTab contract={contract} />}
        {tabValue === 1 && (
          <StatusHistoryTab statusHistory={contract.statusHistory} />
        )}
        {tabValue === 2 && (
          <TicketsTab contract={contract} username={username} />
        )}
        {tabValue === 3 && (
          <UploadsTab contract={contract} username={username} />
        )}
      </Box>
    </>
  );
};

export default ContractTabsSection;
