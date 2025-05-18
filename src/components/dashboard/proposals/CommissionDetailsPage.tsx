"use client";

import React, { useState } from "react";
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
  Stack,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";
import { Star, Info, ChevronLeft, ChevronRight } from "@mui/icons-material";

interface CommissionDetailsProps {
  listing: ICommissionListing;
}

export default function CommissionDetails({ listing }: CommissionDetailsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const formatCurrency = (amount: number) =>
    `IDR ${new Intl.NumberFormat("id-ID").format(amount)}`;

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

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNavigateImage = (direction: "prev" | "next") => {
    if (!listing?.samples?.length) return;

    if (direction === "prev") {
      setActiveImageIndex((prev) =>
        prev === 0 ? listing.samples!.length - 1 : prev - 1
      );
    } else {
      setActiveImageIndex((prev) =>
        prev === listing.samples!.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        mb: 4,
        height: isMobile ? "auto" : "85vh",
      }}
    >
      <Grid container sx={{ height: "100%" }}>
        {/* Content Section */}
        <Grid
          item
          xs={12}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: isMobile
              ? activeTab === 0
                ? "calc(100% - 300px)"
                : "100%"
              : "100%",
          }}
        >
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, mt: 1 }}>
            <Tabs
              value={activeTab}
              onChange={handleChangeTab}
              aria-label="Tabs komisaris"
            >
              <Tab
                icon={<Info />}
                iconPosition="start"
                label="Informasi"
                id="tab-0"
                aria-controls="tabpanel-0"
              />
              <Tab
                icon={<Star />}
                iconPosition="start"
                label={`Ulasan (${listing.reviewsSummary?.count || 0})`}
                id="tab-1"
                aria-controls="tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box
            role="tabpanel"
            hidden={activeTab !== 0}
            id="tabpanel-0"
            aria-labelledby="tab-0"
            sx={{
              flexGrow: 1,
              overflow: "auto",
              display: activeTab === 0 ? "block" : "none",
            }}
          >
            {activeTab === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* Header */}
                <Box sx={{ p: 3, pb: 2 }}>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600, maxWidth: "90%" }}
                  >
                    {listing.title}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    >
                      {formatCurrency(listing.price.min)}
                      {listing.price.min !== listing.price.max
                        ? ` - ${formatCurrency(listing.price.max)}`
                        : ""}
                    </Typography>
                    <Chip
                      label={
                        listing.type === "template"
                          ? "Karakter Anda (YCH)"
                          : "Komisi Kustom"
                      }
                      size="small"
                      color={
                        listing.type === "template" ? "primary" : "secondary"
                      }
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={
                        listing.flow === "standard"
                          ? "Alur Kerja Standar"
                          : "Berbasis Milestone"
                      }
                      size="small"
                      color={listing.flow === "standard" ? "default" : "info"}
                      sx={{ fontWeight: 600 }}
                    />
                    {listing.reviewsSummary?.count > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Star fontSize="small" color="warning" />
                        <Typography variant="body2">
                          {listing.reviewsSummary.avg.toFixed(1)} (
                          {listing.reviewsSummary.count})
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    {listing.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Commission Info */}
                <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
                  {/* Basic Commission Info */}
                  <Box sx={{ mb: 4 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tipe Komisi
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ mb: 1, textTransform: "capitalize" }}
                        >
                          {listing.type === "template"
                            ? "Template (YCH)"
                            : "Kustom"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Alur Proses
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ mb: 1, textTransform: "capitalize" }}
                        >
                          {listing.flow === "standard"
                            ? "Standar"
                            : "Milestone"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Mata Uang
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {listing.currency}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Pricing Info */}
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Rentang Harga
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Harga Dasar
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {formatCurrency(listing.basePrice)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Rentang Harga
                            </Typography>
                            <Typography variant="body1">
                              {formatCurrency(listing.price.min)} -{" "}
                              {formatCurrency(listing.price.max)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Biaya Pembatalan
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
                        <Grid item xs={12}>
                          <Card variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                              >
                                Penalti Keterlambatan
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

                  {/* Slots Information */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Informasi Slot
                    </Typography>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Total Slot
                            </Typography>
                            <Typography variant="body1">
                              {listing.slots === -1
                                ? "Tidak Terbatas"
                                : listing.slots}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Slot Terpakai
                            </Typography>
                            <Typography variant="body1">
                              {listing.slotsUsed}{" "}
                              {listing.slots !== -1 && `dari ${listing.slots}`}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Deadline Info */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Informasi Tenggat Waktu
                    </Typography>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Mode
                            </Typography>
                            <Typography variant="body1">
                              {listing.deadline.mode === "standard"
                                ? "Standar"
                                : listing.deadline.mode === "withDeadline"
                                ? "Dengan Tenggat"
                                : "Dengan Rush"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Jangka Waktu
                            </Typography>
                            <Typography variant="body1">
                              {listing.deadline.min} - {listing.deadline.max}{" "}
                              hari
                            </Typography>
                          </Grid>
                          {listing.deadline.rushFee && (
                            <Grid item xs={12} sm={4}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                Biaya Rush
                              </Typography>
                              <Typography variant="body1">
                                {listing.deadline.rushFee.kind === "flat"
                                  ? formatCurrency(
                                      listing.deadline.rushFee.amount
                                    )
                                  : `${formatCurrency(
                                      listing.deadline.rushFee.amount
                                    )} per hari`}
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
                      <Typography
                        variant="subtitle1"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Kebijakan Revisi
                      </Typography>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                Tipe
                              </Typography>
                              <Typography variant="body1">
                                {listing.revisions.type === "none"
                                  ? "Tidak Ada"
                                  : listing.revisions.type === "standard"
                                  ? "Standar"
                                  : "Per Milestone"}
                              </Typography>
                            </Grid>
                            {listing.revisions.policy && (
                              <>
                                <Grid item xs={12} sm={3}>
                                  <Typography
                                    variant="subtitle2"
                                    color="text.secondary"
                                  >
                                    Revisi Gratis
                                  </Typography>
                                  <Typography variant="body1">
                                    {listing.revisions.policy.limit
                                      ? listing.revisions.policy.free
                                      : "Tidak Terbatas"}
                                  </Typography>
                                </Grid>
                                {listing.revisions.policy.extraAllowed && (
                                  <>
                                    <Grid item xs={12} sm={3}>
                                      <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                      >
                                        Revisi Tambahan
                                      </Typography>
                                      <Typography variant="body1">
                                        Diperbolehkan
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                      <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                      >
                                        Biaya per Tambahan
                                      </Typography>
                                      <Typography variant="body1">
                                        {formatCurrency(
                                          listing.revisions.policy.fee
                                        )}
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
                      <Typography
                        variant="subtitle1"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Milestone
                      </Typography>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table>
                          <TableBody>
                            {listing.milestones.map((milestone) => (
                              <TableRow key={milestone.id}>
                                <TableCell>
                                  <Typography variant="body1">
                                    {milestone.title}
                                  </Typography>
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
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {milestone.policy.limit
                                        ? `${milestone.policy.free} revisi gratis`
                                        : "Revisi tidak terbatas"}
                                      {milestone.policy.extraAllowed &&
                                        ` (${formatCurrency(
                                          milestone.policy.fee
                                        )} per tambahan)`}
                                    </Typography>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    </Box>
                  )}

                  {/* Description sections */}
                  {listing.description && listing.description.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Deskripsi Komisi
                      </Typography>
                      {listing.description.map((section, index) => (
                        <Card
                          variant="outlined"
                          key={index}
                          sx={{ mb: 2, borderRadius: 2 }}
                        >
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              {section.title}
                            </Typography>
                            <Typography variant="body1">
                              {section.detail}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}

                  {/* General Options */}
                  {hasGeneralOptions && (
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Opsi Umum
                      </Typography>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          {listing.generalOptions?.optionGroups &&
                            listing.generalOptions.optionGroups.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="medium"
                                  gutterBottom
                                >
                                  Kelompok Opsi
                                </Typography>
                                {listing.generalOptions.optionGroups.map(
                                  (group) => (
                                    <Box key={group.id} sx={{ mb: 2 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {group.title}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        flexWrap="wrap"
                                        sx={{ mt: 1 }}
                                      >
                                        {group.selections.map((selection) => (
                                          <Chip
                                            key={selection.id}
                                            label={`${
                                              selection.label
                                            } (${formatCurrency(
                                              selection.price
                                            )})`}
                                            size="small"
                                            variant="outlined"
                                          />
                                        ))}
                                      </Stack>
                                    </Box>
                                  )
                                )}
                              </Box>
                            )}

                          {listing.generalOptions?.addons &&
                            listing.generalOptions.addons.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="medium"
                                  gutterBottom
                                >
                                  Tambahan
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                >
                                  {listing.generalOptions.addons.map(
                                    (addon) => (
                                      <Chip
                                        key={addon.id}
                                        label={`${
                                          addon.label
                                        } (${formatCurrency(addon.price)})`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )
                                  )}
                                </Stack>
                              </Box>
                            )}

                          {listing.generalOptions?.questions &&
                            listing.generalOptions.questions.length > 0 && (
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="medium"
                                  gutterBottom
                                >
                                  Pertanyaan Tambahan
                                </Typography>
                                {listing.generalOptions.questions.map(
                                  (question) => (
                                    <Typography
                                      key={question.id}
                                      variant="body2"
                                      sx={{ mb: 1 }}
                                    >
                                      • {question.text}
                                    </Typography>
                                  )
                                )}
                              </Box>
                            )}
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* Subject Options */}
                  {hasSubjectOptions && (
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="medium"
                        gutterBottom
                      >
                        Opsi Subjek
                      </Typography>
                      {listing.subjectOptions?.map((subject) => (
                        <Card
                          key={subject.id}
                          variant="outlined"
                          sx={{ mb: 2, borderRadius: 2 }}
                        >
                          <CardContent>
                            <Typography
                              variant="subtitle2"
                              fontWeight="medium"
                              gutterBottom
                            >
                              {subject.title}
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                (Batas:{" "}
                                {subject.limit === -1
                                  ? "Tidak Terbatas"
                                  : subject.limit}
                                )
                                {subject.discount &&
                                  ` • Diskon ${subject.discount}% untuk tambahan`}
                              </Typography>
                            </Typography>

                            {subject.optionGroups &&
                              subject.optionGroups.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  {subject.optionGroups.map((group) => (
                                    <Box key={group.id} sx={{ mb: 2 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {group.title}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        flexWrap="wrap"
                                        sx={{ mt: 1 }}
                                      >
                                        {group.selections.map((selection) => (
                                          <Chip
                                            key={selection.id}
                                            label={`${
                                              selection.label
                                            } (${formatCurrency(
                                              selection.price
                                            )})`}
                                            size="small"
                                            variant="outlined"
                                          />
                                        ))}
                                      </Stack>
                                    </Box>
                                  ))}
                                </Box>
                              )}

                            {subject.addons && subject.addons.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  gutterBottom
                                >
                                  Tambahan
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                >
                                  {subject.addons.map((addon) => (
                                    <Chip
                                      key={addon.id}
                                      label={`${addon.label} (${formatCurrency(
                                        addon.price
                                      )})`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {subject.questions &&
                              subject.questions.length > 0 && (
                                <Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                  >
                                    Pertanyaan
                                  </Typography>
                                  {subject.questions.map((question) => (
                                    <Typography
                                      key={question.id}
                                      variant="body2"
                                      sx={{ mb: 1 }}
                                    >
                                      • {question.text}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>

          <Box
            role="tabpanel"
            hidden={activeTab !== 1}
            id="tabpanel-1"
            aria-labelledby="tab-1"
            sx={{
              flexGrow: 1,
              overflow: "auto",
              display: activeTab === 1 ? "block" : "none",
              p: 3,
            }}
          >
            {activeTab === 1 && (
              <Box>
                {listing.reviewsSummary?.count > 0 ? (
                  <Stack direction="column" spacing={2}>
                    <Box textAlign="center">
                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        color="primary"
                      >
                        {listing.reviewsSummary.avg.toFixed(1)}
                      </Typography>
                      <Stack
                        direction="row"
                        justifyContent="center"
                        spacing={0.5}
                        sx={{ mb: 1 }}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            fontSize="small"
                            color={
                              i < Math.round(listing.reviewsSummary.avg)
                                ? "warning"
                                : "disabled"
                            }
                          />
                        ))}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Berdasarkan {listing.reviewsSummary.count} ulasan
                      </Typography>
                    </Box>

                    <Typography variant="body1" textAlign="center">
                      Untuk melihat detail ulasan, silakan klik tab Ulasan pada
                      dialog komisi.
                    </Typography>
                  </Stack>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      Belum ada ulasan untuk komisi ini.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
