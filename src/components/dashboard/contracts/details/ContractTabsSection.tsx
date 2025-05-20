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

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
  component: React.ReactNode;
}

/**
 * Component to display contract tabs with different sections
 */
const ContractTabsSection: React.FC<ContractTabsSectionProps> = ({
  contract,
  username,
}) => {
  const [tabValue, setTabValue] = useState(0);

  // Common tab style
  const tabIconPosition = "start";

  // Define tab configuration
  const tabs: TabConfig[] = [
    {
      id: "terms",
      label: "Ketentuan",
      icon: <DescriptionIcon />,
      component: <ContractTermsTab contract={contract} />,
    },
    {
      id: "status-history",
      label: "Riwayat Status",
      icon: <HistoryIcon />,
      component: <StatusHistoryTab statusHistory={contract.statusHistory} />,
    },
    {
      id: "tickets",
      label: "Tiket",
      icon: <ConfirmationNumberIcon />,
      component: <TicketsTab contract={contract} username={username} />,
    },
    {
      id: "uploads",
      label: "Unggahan",
      icon: <CloudUploadIcon />,
      component: <UploadsTab contract={contract} username={username} />,
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 1 }} >
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              iconPosition={tabIconPosition}
              label={tab.label}
            />
          ))}
        </Tabs>
      </Box>

      <Box p={3}>{tabs[tabValue].component}</Box>
    </Paper>
  );
};

export default ContractTabsSection;
