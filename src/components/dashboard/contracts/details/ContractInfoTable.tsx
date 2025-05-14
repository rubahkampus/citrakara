// src/components/dashboard/contracts/ContractInfoTable.tsx
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

const ContractInfoTable: React.FC<ContractInfoTableProps> = ({ contract }) => {
  // Format date helper
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Calculate time remaining helper
  const getTimeRemaining = (deadline: string | Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);

    if (deadlineDate < now) {
      return { text: "Passed", color: "error" };
    }

    const diffTime = Math.abs(deadlineDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return { text: `${diffDays} days`, color: "error" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, color: "warning" };
    } else {
      return { text: `${diffDays} days`, color: "success" };
    }
  };

  const timeRemaining = getTimeRemaining(contract.deadlineAt);

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #e0e0e0" }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row" sx={{ width: "40%" }}>
              <Box display="flex" alignItems="center">
                <BusinessIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                ID Kontrak
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontFamily="monospace">
                {contract._id.toString().substring(0, 10)}...
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Box display="flex" alignItems="center">
                <AccountCircleIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                Klien
              </Box>
            </TableCell>
            <TableCell>{contract.clientId.toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Box display="flex" alignItems="center">
                <AccountCircleIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                Ilustrator
              </Box>
            </TableCell>
            <TableCell>{contract.artistId.toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Box display="flex" alignItems="center">
                <CalendarTodayIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                Tanggal Dibuat
              </Box>
            </TableCell>
            <TableCell>{formatDate(contract.createdAt)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Box display="flex" alignItems="center">
                <TimerIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                Deadline
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                {formatDate(contract.deadlineAt)}
                <Chip
                  size="small"
                  label={timeRemaining.text}
                  color={timeRemaining.color as any}
                  sx={{ ml: 1 }}
                />
              </Box>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              <Box display="flex" alignItems="center">
                <CalendarTodayIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
                Akhir Masa Toleransi
              </Box>
            </TableCell>
            <TableCell>{formatDate(contract.graceEndsAt)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Jenis Alur
            </TableCell>
            <TableCell>
              <Chip
                size="small"
                label={contract.proposalSnapshot.listingSnapshot.flow}
                color="primary"
                variant="outlined"
              />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Progres Pekerjaan
            </TableCell>
            <TableCell>
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
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContractInfoTable;
