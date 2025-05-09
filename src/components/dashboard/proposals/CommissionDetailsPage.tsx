"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Divider,
} from "@mui/material";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

interface CommissionDetailsProps {
  listing: ICommissionListing;
}

export default function CommissionDetails({ listing }: CommissionDetailsProps) {
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Helper function to check if section has content
  const hasGeneralOptions =
    listing.generalOptions &&
    ((listing.generalOptions.optionGroups &&
      listing.generalOptions.optionGroups.length > 0) ||
      (listing.generalOptions.addons &&
        listing.generalOptions.addons.length > 0) ||
      (listing.generalOptions.questions &&
        listing.generalOptions.questions.length > 0));

  const hasSubjectOptions =
    listing.subjectOptions && listing.subjectOptions.length > 0;

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Commission Details
      </Typography>

      {/* Basic Commission Info */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Commission Type
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 1, textTransform: "capitalize" }}
            >
              {listing.type}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Process Flow
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 1, textTransform: "capitalize" }}
            >
              {listing.flow}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              Currency
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {listing.currency}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Pricing Info */}
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Price Range
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Base Price
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(listing.basePrice)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Price Range
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(listing.price.min)} -{" "}
                  {formatCurrency(listing.price.max)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Cancelation Fee
                </Typography>
                <Typography variant="body1">
                  {listing.cancelationFee.kind === "flat"
                    ? formatCurrency(listing.cancelationFee.amount)
                    : `${listing.cancelationFee.amount}%`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {listing.latePenaltyPercent && (
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Late Penalty
                  </Typography>
                  <Typography variant="body1">
                    {listing.latePenaltyPercent}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Deadline Info */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Deadline Information
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mode
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ textTransform: "capitalize" }}
                >
                  {listing.deadline.mode}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timeframe
                </Typography>
                <Typography variant="body1">
                  {listing.deadline.min} - {listing.deadline.max} days
                </Typography>
              </Grid>
              {listing.deadline.rushFee && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Rush Fee
                  </Typography>
                  <Typography variant="body1">
                    {listing.deadline.rushFee.kind === "flat"
                      ? formatCurrency(listing.deadline.rushFee.amount)
                      : `${formatCurrency(
                          listing.deadline.rushFee.amount
                        )} per day`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Revision Policy */}
      {listing.revisions && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Revision Policy
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {listing.revisions.type}
                  </Typography>
                </Grid>
                {listing.revisions.policy && (
                  <>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Free Revisions
                      </Typography>
                      <Typography variant="body1">
                        {listing.revisions.policy.limit
                          ? listing.revisions.policy.free
                          : "Unlimited"}
                      </Typography>
                    </Grid>
                    {listing.revisions.policy.extraAllowed && (
                      <>
                        <Grid item xs={12} sm={3}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Extra Revisions
                          </Typography>
                          <Typography variant="body1">Allowed</Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Fee per Extra
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(listing.revisions.policy.fee)}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Milestones */}
      {listing.milestones && listing.milestones.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Milestones
          </Typography>
          <Table>
            <TableBody>
              {listing.milestones.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell>
                    <Typography variant="body1">{milestone.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${milestone.percent}%`}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  {milestone.policy && (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.policy.limit
                          ? `${milestone.policy.free} free revisions`
                          : "Unlimited revisions"}
                        {milestone.policy.extraAllowed &&
                          ` (${formatCurrency(
                            milestone.policy.fee
                          )} per extra)`}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Description sections */}
      {listing.description && listing.description.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Commission Description
          </Typography>
          {listing.description.map((section, index) => (
            <Card variant="outlined" key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  gutterBottom
                >
                  {section.title}
                </Typography>
                <Typography variant="body1">{section.detail}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Paper>
  );
}
