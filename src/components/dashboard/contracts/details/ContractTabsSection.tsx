// src/components/dashboard/contracts/ContractTabsSection.tsx
import React, { useState } from "react";
import { Box, Tabs, Tab, Paper } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
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
    <Paper elevation={0} sx={{ borderRadius: 1 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Terms" />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label="Status History"
          />
          <Tab
            icon={<ConfirmationNumberIcon />}
            iconPosition="start"
            label="Tickets"
          />
          <Tab
            icon={<CloudUploadIcon />}
            iconPosition="start"
            label="Uploads"
          />
        </Tabs>
      </Box>

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
    </Paper>
  );
};

export default ContractTabsSection;
