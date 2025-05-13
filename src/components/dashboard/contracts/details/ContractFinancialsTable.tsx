// src/components/dashboard/contracts/ContractFinancialsTable.tsx
import React from "react";
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

interface ContractFinancialsTableProps {
  finance: {
    basePrice: number;
    optionFees: number;
    addons: number;
    rushFee: number;
    discount: number;
    surcharge: number;
    runtimeFees: number;
    total: number;
  };
}

const ContractFinancialsTable: React.FC<ContractFinancialsTableProps> = ({
  finance,
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #e0e0e0" }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              Base Price
            </TableCell>
            <TableCell align="right">
              {formatCurrency(finance.basePrice)}
            </TableCell>
          </TableRow>
          {finance.optionFees > 0 && (
            <TableRow>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <AddCircleIcon
                    fontSize="small"
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  Option Fees
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(finance.optionFees)}
              </TableCell>
            </TableRow>
          )}
          {finance.addons > 0 && (
            <TableRow>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <AddCircleIcon
                    fontSize="small"
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  Add-ons
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(finance.addons)}
              </TableCell>
            </TableRow>
          )}
          {finance.rushFee > 0 && (
            <TableRow>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <AddCircleIcon
                    fontSize="small"
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  Rush Fee
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(finance.rushFee)}
              </TableCell>
            </TableRow>
          )}
          {finance.discount > 0 && (
            <TableRow>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <RemoveCircleIcon
                    fontSize="small"
                    color="error"
                    sx={{ mr: 1 }}
                  />
                  Discount
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ color: "error.main" }}>
                -{formatCurrency(finance.discount)}
              </TableCell>
            </TableRow>
          )}
          {finance.surcharge > 0 && (
            <TableRow>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <AddCircleIcon
                    fontSize="small"
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  Surcharge
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(finance.surcharge)}
              </TableCell>
            </TableRow>
          )}
          {finance.runtimeFees > 0 && (
            <TableRow>
              <TableCell component="th" scope="row">
                <Box display="flex" alignItems="center">
                  <AddCircleIcon
                    fontSize="small"
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  Runtime Fees
                </Box>
              </TableCell>
              <TableCell align="right">
                {formatCurrency(finance.runtimeFees)}
              </TableCell>
            </TableRow>
          )}
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell component="th" scope="row">
              <Typography fontWeight="bold">Total Amount</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">
                {formatCurrency(finance.total)}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContractFinancialsTable;
