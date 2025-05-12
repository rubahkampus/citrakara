// src/components/dashboard/contracts/ContractFinancialsTable.tsx
import React from "react";
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

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
  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              Base Price
            </TableCell>
            <TableCell>{finance.basePrice}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Option Fees
            </TableCell>
            <TableCell>{finance.optionFees}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Add-ons
            </TableCell>
            <TableCell>{finance.addons}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Rush Fee
            </TableCell>
            <TableCell>{finance.rushFee}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Discount
            </TableCell>
            <TableCell>-{finance.discount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Surcharge
            </TableCell>
            <TableCell>{finance.surcharge}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Runtime Fees
            </TableCell>
            <TableCell>{finance.runtimeFees}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Total Amount
            </TableCell>
            <TableCell>
              <Typography fontWeight="bold">{finance.total}</Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContractFinancialsTable;
