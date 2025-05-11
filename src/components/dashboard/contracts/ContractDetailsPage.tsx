// src/components/dashboard/contracts/ContractDetailsPage.tsx
'use client'

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import Link from "next/link";
import { IContract } from "@/lib/db/models/contract.model";
import ContractStatusBadge from "./ContractStatusBadge";
import ContractActionButtons from "./ContractActionButtons";

interface ContractDetailsPageProps {
  username: string;
  contract: IContract;
  userId: string;
}

const ContractDetailsPage: React.FC<ContractDetailsPageProps> = ({
  username,
  contract,
  userId,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const isArtist = contract.artistId.toString() === userId;
  const isClient = contract.clientId.toString() === userId;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
    <Box>
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5">Contract Details</Typography>
          <ContractStatusBadge status={contract.status} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
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
          </Grid>

          <Grid item xs={12} md={6}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Base Price
                    </TableCell>
                    <TableCell>{contract.finance.basePrice}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Option Fees
                    </TableCell>
                    <TableCell>{contract.finance.optionFees}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Add-ons
                    </TableCell>
                    <TableCell>{contract.finance.addons}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Rush Fee
                    </TableCell>
                    <TableCell>{contract.finance.rushFee}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Discount
                    </TableCell>
                    <TableCell>-{contract.finance.discount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Surcharge
                    </TableCell>
                    <TableCell>{contract.finance.surcharge}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Runtime Fees
                    </TableCell>
                    <TableCell>{contract.finance.runtimeFees}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Total Amount
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {contract.finance.total}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <Box mt={3}>
          <ContractActionButtons
            username={username}
            contract={contract}
            isArtist={isArtist}
            isClient={isClient}
          />
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }} elevation={1}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Terms" />
          <Tab label="Status History" />
          <Tab label="Tickets" />
          <Tab label="Uploads" />
        </Tabs>

        <Box p={3}>
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Contract Terms
              </Typography>
              <Typography fontWeight="bold" gutterBottom>
                Description
              </Typography>
              <Typography gutterBottom>
                {
                  contract.contractTerms[contract.contractTerms.length - 1]
                    .generalDescription
                }
              </Typography>

              {contract.contractTerms[contract.contractTerms.length - 1]
                .referenceImages?.length > 0 && (
                <Box mt={2}>
                  <Typography fontWeight="bold" gutterBottom>
                    Reference Images
                  </Typography>
                  <Grid container spacing={1}>
                    {contract.contractTerms[
                      contract.contractTerms.length - 1
                    ].referenceImages.map((image, index) => (
                      <Grid item key={index} xs={6} sm={4} md={3}>
                        <Box
                          component="img"
                          src={image}
                          alt={`Reference ${index + 1}`}
                          sx={{
                            width: "100%",
                            height: "auto",
                            borderRadius: 1,
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {contract.contractVersion > 1 && (
                <Box mt={3}>
                  <Typography>
                    This contract has been amended{" "}
                    {contract.contractVersion - 1} times.
                    <MuiLink
                      component="button"
                      onClick={() => alert("Contract history would show here")}
                    >
                      View history
                    </MuiLink>
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Status History
              </Typography>
              {contract.statusHistory.map((entry, index) => (
                <Box
                  key={index}
                  mb={1}
                  pb={1}
                  borderBottom={
                    index < contract.statusHistory.length - 1
                      ? "1px solid #eee"
                      : "none"
                  }
                >
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">{entry.event}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(entry.at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Tickets</Typography>
                <Link
                  href={`/${username}/dashboard/contracts/${contract._id}/tickets`}
                  passHref
                >
                  <Button size="small" variant="outlined">
                    View All Tickets
                  </Button>
                </Link>
              </Box>

              {contract.cancelTickets?.length === 0 &&
              contract.revisionTickets?.length === 0 &&
              contract.changeTickets?.length === 0 &&
              contract.resolutionTickets?.length === 0 ? (
                <Typography color="textSecondary">No tickets found</Typography>
              ) : (
                <Box>
                  {contract.cancelTickets?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Cancellation Tickets
                      </Typography>
                      <Typography>
                        {contract.cancelTickets.length} ticket(s)
                      </Typography>
                    </Box>
                  )}

                  {contract.revisionTickets?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Revision Tickets
                      </Typography>
                      <Typography>
                        {contract.revisionTickets.length} ticket(s)
                      </Typography>
                    </Box>
                  )}

                  {contract.changeTickets?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Change Tickets
                      </Typography>
                      <Typography>
                        {contract.changeTickets.length} ticket(s)
                      </Typography>
                    </Box>
                  )}

                  {contract.resolutionTickets?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Resolution Tickets
                      </Typography>
                      <Typography>
                        {contract.resolutionTickets.length} ticket(s)
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

          {tabValue === 3 && (
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Uploads</Typography>
                <Link
                  href={`/${username}/dashboard/contracts/${contract._id}/uploads`}
                  passHref
                >
                  <Button size="small" variant="outlined">
                    View All Uploads
                  </Button>
                </Link>
              </Box>

              {contract.progressUploadsStandard?.length === 0 &&
              contract.progressUploadsMilestone?.length === 0 &&
              contract.revisionUploads?.length === 0 &&
              contract.finalUploads?.length === 0 ? (
                <Typography color="textSecondary">No uploads found</Typography>
              ) : (
                <Box>
                  {contract.progressUploadsStandard?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Progress Uploads (Standard)
                      </Typography>
                      <Typography>
                        {contract.progressUploadsStandard.length} upload(s)
                      </Typography>
                    </Box>
                  )}

                  {contract.progressUploadsMilestone?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Progress Uploads (Milestone)
                      </Typography>
                      <Typography>
                        {contract.progressUploadsMilestone.length} upload(s)
                      </Typography>
                    </Box>
                  )}

                  {contract.revisionUploads?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Revision Uploads
                      </Typography>
                      <Typography>
                        {contract.revisionUploads.length} upload(s)
                      </Typography>
                    </Box>
                  )}

                  {contract.finalUploads?.length > 0 && (
                    <Box mb={2}>
                      <Typography fontWeight="bold" gutterBottom>
                        Final Uploads
                      </Typography>
                      <Typography>
                        {contract.finalUploads.length} upload(s)
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Milestone section, only shown for milestone-flow contracts */}
      {contract.proposalSnapshot.listingSnapshot.flow === "milestone" && (
        <Paper sx={{ p: 3 }} elevation={1}>
          <Typography variant="h6" gutterBottom>
            Milestones
          </Typography>

          {contract.milestones?.map((milestone, index) => (
            <Box
              key={index}
              mb={2}
              pb={2}
              borderBottom={
                index < (contract.milestones?.length || 0) - 1
                  ? "1px solid #eee"
                  : "none"
              }
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography>
                  <Typography component="span" fontWeight="bold">
                    {milestone.title}
                  </Typography>
                  {" - "}
                  {milestone.percent}%
                </Typography>
                <Chip
                  size="small"
                  label={milestone.status}
                  color={
                    milestone.status === "accepted"
                      ? "success"
                      : milestone.status === "rejected"
                      ? "error"
                      : milestone.status === "inProgress"
                      ? "primary"
                      : "default"
                  }
                />
              </Box>

              {milestone.status !== "pending" && (
                <Box mt={1}>
                  {milestone.startedAt && (
                    <Typography variant="body2">
                      Started: {formatDate(milestone.startedAt)}
                    </Typography>
                  )}

                  {milestone.completedAt && (
                    <Typography variant="body2">
                      Completed: {formatDate(milestone.completedAt)}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default ContractDetailsPage;
