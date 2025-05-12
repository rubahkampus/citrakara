// src/components/dashboard/contracts/ContractInfoTable.tsx
import React from "react";
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
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
      return "Passed";
    }

    const diffTime = Math.abs(deadlineDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} days`;
  };

  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell component="th" scope="row">
              Contract ID
            </TableCell>
            <TableCell>{contract._id.toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Client
            </TableCell>
            <TableCell>{contract.clientId.toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Artist
            </TableCell>
            <TableCell>{contract.artistId.toString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Created At
            </TableCell>
            <TableCell>{formatDate(contract.createdAt)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Deadline
            </TableCell>
            <TableCell>
              {formatDate(contract.deadlineAt)}(
              {getTimeRemaining(contract.deadlineAt)} remaining)
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Grace Period Ends
            </TableCell>
            <TableCell>{formatDate(contract.graceEndsAt)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Flow Type
            </TableCell>
            <TableCell>
              {contract.proposalSnapshot.listingSnapshot.flow}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell component="th" scope="row">
              Work Progress
            </TableCell>
            <TableCell>{contract.workPercentage}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ContractInfoTable;
