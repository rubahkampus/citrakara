import React from "react";
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TimerIcon from "@mui/icons-material/Timer";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BusinessIcon from "@mui/icons-material/Business";
import { IContract } from "@/lib/db/models/contract.model";

interface ContractInfoTableProps {
  contract: IContract;
}

// Define time remaining result type
interface TimeRemainingResult {
  text: string;
  color: "error" | "warning" | "success";
}

// Define contract info item type
interface ContractInfoItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

/**
 * Component to display contract information in tabular format
 */
const ContractInfoTable: React.FC<ContractInfoTableProps> = ({ contract }) => {
  // Common styles for cell icons
  const iconStyle = { mr: 1, color: "text.secondary" };

  // Format date helper
  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString();
  };

  // Calculate time remaining helper
  const getTimeRemaining = (deadline: string | Date): TimeRemainingResult => {
    const now = new Date();
    const deadlineDate = new Date(deadline);

    if (deadlineDate < now) {
      return { text: "Lewat", color: "error" };
    }

    const diffTime = Math.abs(deadlineDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return { text: `${diffDays} hari`, color: "error" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} hari`, color: "warning" };
    } else {
      return { text: `${diffDays} hari`, color: "success" };
    }
  };

  const timeRemaining = getTimeRemaining(contract.deadlineAt);

  // Format contract ID
  const contractIdShort = contract._id.toString().substring(0, 10) + "...";

  // Define contract info items
  const contractInfoItems: ContractInfoItem[] = [
    {
      id: "contract-id",
      label: "ID Kontrak",
      icon: <BusinessIcon fontSize="small" sx={iconStyle} />,
      content: (
        <Typography variant="body2" fontFamily="monospace">
          {contractIdShort}
        </Typography>
      ),
    },
    {
      id: "client",
      label: "Klien",
      icon: <AccountCircleIcon fontSize="small" sx={iconStyle} />,
      content: contract.clientId.toString(),
    },
    {
      id: "artist",
      label: "Ilustrator",
      icon: <AccountCircleIcon fontSize="small" sx={iconStyle} />,
      content: contract.artistId.toString(),
    },
    {
      id: "created-date",
      label: "Tanggal Dibuat",
      icon: <CalendarTodayIcon fontSize="small" sx={iconStyle} />,
      content: formatDate(contract.createdAt),
    },
    {
      id: "deadline",
      label: "Deadline",
      icon: <TimerIcon fontSize="small" sx={iconStyle} />,
      content: (
        <Box display="flex" alignItems="center">
          {formatDate(contract.deadlineAt)}
          <Chip
            size="small"
            label={timeRemaining.text}
            color={timeRemaining.color}
            sx={{ ml: 1 }}
          />
        </Box>
      ),
    },
    {
      id: "grace-period",
      label: "Akhir Masa Toleransi",
      icon: <CalendarTodayIcon fontSize="small" sx={iconStyle} />,
      content: formatDate(contract.graceEndsAt),
    },
    {
      id: "flow-type",
      label: "Jenis Alur",
      content: (
        <Chip
          size="small"
          label={contract.proposalSnapshot.listingSnapshot.flow}
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      id: "work-progress",
      label: "Progres Pekerjaan",
      content: (
        <Box display="flex" alignItems="center">
          <Box sx={{ width: "60%", mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={contract.workPercentage}
              sx={{ height: 8, borderRadius: 5 }}
            />
          </Box>
          <Typography variant="body2" fontWeight="medium">
            {contract.workPercentage}%
          </Typography>
        </Box>
      ),
    },
  ];

  // Render icon with label
  const renderLabelWithIcon = (item: ContractInfoItem) => (
    <Box display="flex" alignItems="center">
      {item.icon}
      {item.label}
    </Box>
  );

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #e0e0e0" }}
    >
      <Table size="small">
        <TableBody>
          {contractInfoItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell component="th" scope="row" sx={{ width: "40%" }}>
                {item.icon ? renderLabelWithIcon(item) : item.label}
              </TableCell>
              <TableCell>{item.content}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContractInfoTable;
