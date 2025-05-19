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

interface FinanceItem {
  label: string;
  amount: number;
  isAddition?: boolean;
  isDeduction?: boolean;
}

interface ContractFinance {
  basePrice: number;
  optionFees: number;
  addons: number;
  rushFee: number;
  discount: number;
  surcharge: number;
  runtimeFees: number;
  total: number;
}

interface ContractFinancialsTableProps {
  finance: ContractFinance;
}

const ContractFinancialsTable: React.FC<ContractFinancialsTableProps> = ({
  finance,
}) => {
  // Format currency using Indonesian locale
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  // Define reusable styles
  const iconStyle = { mr: 1 };

  // Helper function to render line items conditionally
  const renderLineItem = ({
    label,
    amount,
    isAddition,
    isDeduction,
  }: FinanceItem) => {
    if (amount <= 0) return null;

    return (
      <TableRow>
        <TableCell component="th" scope="row">
          <Box display="flex" alignItems="center">
            {isAddition && (
              <AddCircleIcon fontSize="small" color="success" sx={iconStyle} />
            )}
            {isDeduction && (
              <RemoveCircleIcon fontSize="small" color="error" sx={iconStyle} />
            )}
            {label}
          </Box>
        </TableCell>
        <TableCell
          align="right"
          sx={isDeduction ? { color: "error.main" } : undefined}
        >
          {isDeduction ? "-" : ""}
          {formatCurrency(amount)}
        </TableCell>
      </TableRow>
    );
  };

  // Define line items
  const financeItems: FinanceItem[] = [
    { label: "Opsi", amount: finance.optionFees, isAddition: true },
    { label: "Tambahan", amount: finance.addons, isAddition: true },
    {
      label: "Biaya Pengerjaan Cepat",
      amount: finance.rushFee,
      isAddition: true,
    },
    { label: "Diskon Seniman", amount: finance.discount, isDeduction: true },
    { label: "Tambahan Seniman", amount: finance.surcharge, isAddition: true },
    { label: "Biaya Berjalan", amount: finance.runtimeFees, isAddition: true },
  ];

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #e0e0e0" }}
    >
      <Table size="small">
        <TableBody>
          {/* Base Price - Always shown */}
          <TableRow>
            <TableCell component="th" scope="row">
              Harga Dasar
            </TableCell>
            <TableCell align="right">
              {formatCurrency(finance.basePrice)}
            </TableCell>
          </TableRow>

          {/* Dynamic Finance Items */}
          {financeItems.map((item, index) => renderLineItem(item))}

          {/* Total Row */}
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell component="th" scope="row">
              <Typography fontWeight="bold">Total Jumlah</Typography>
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
