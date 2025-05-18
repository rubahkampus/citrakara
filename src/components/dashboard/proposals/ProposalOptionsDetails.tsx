"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  Info as InfoIcon,
  Cancel as CancelIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";
import {
  IAddon,
  IOptionGroup,
  IQuestion,
} from "@/lib/db/models/commissionListing.model";

interface ProposalOptionsDetailsProps {
  proposal: any; // Using any for brevity, you could define a proper type
  formatCurrency: (amount: number) => string;
  formatDate: (dateInput: string | Date) => string;
}

export default function ProposalOptionsDetails({
  proposal,
  formatCurrency,
  formatDate,
}: ProposalOptionsDetailsProps) {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Helper to find option group, selection, or addon details from the listing snapshot
  const findOptionDetails = (type: string, id: number) => {
    if (type === "group") {
      return proposal.listingSnapshot.generalOptions?.optionGroups?.find(
        (group: any) => group.id === id
      );
    } else if (type === "addon") {
      return proposal.listingSnapshot.generalOptions?.addons?.find(
        (addon: any) => addon.id === id
      );
    } else if (type === "question") {
      return proposal.listingSnapshot.generalOptions?.questions?.find(
        (question: any) => question.id === id
      );
    }
    return null;
  };

  // Helper to find subject option details from the listing snapshot
  const findSubjectDetails = (subjectId: number) => {
    return proposal.listingSnapshot.subjectOptions?.find(
      (subject: any) => subject.id === subjectId
    );
  };

  // Helper to find subject option group, selection, or addon details
  const findSubjectOptionDetails = (
    subjectId: number,
    type: string,
    id: number
  ) => {
    const subject = findSubjectDetails(subjectId);
    if (!subject) return null;

    if (type === "group") {
      return subject.optionGroups?.find((group: any) => group.id === id);
    } else if (type === "addon") {
      return subject.addons?.find((addon: any) => addon.id === id);
    } else if (type === "question") {
      return subject.questions?.find((question: any) => question.id === id);
    }
    return null;
  };

  // Helper to find selection details from a group
  const findSelectionDetails = (groupDetails: any, selectionId: number) => {
    if (!groupDetails || !groupDetails.selections) return null;
    return groupDetails.selections.find(
      (selection: any) => selection.id === selectionId
    );
  };

  // Render general options in a more intuitive way
  const renderGeneralOptions = () => {
    if (!proposal.generalOptions) {
      return <Typography>Tidak ada opsi yang dipilih</Typography>;
    }

    return (
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Opsi Umum
          </Typography>

          {/* Option Groups */}
          {proposal.generalOptions.optionGroups &&
            proposal.generalOptions.optionGroups.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Grup Opsi
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Opsi</TableCell>
                        <TableCell>Pilihan</TableCell>
                        <TableCell align="right">Harga</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proposal.generalOptions.optionGroups.map(
                        (option: any) => {
                          const groupDetails = findOptionDetails(
                            "group",
                            option.groupId
                          ) as IOptionGroup;
                          const selectionDetails = groupDetails
                            ? findSelectionDetails(
                                groupDetails,
                                option.selectedSelectionID
                              )
                            : null;

                          return (
                            <TableRow key={option.id}>
                              <TableCell>
                                {groupDetails?.title ||
                                  `Grup Opsi ${option.groupId}`}
                              </TableCell>
                              <TableCell>
                                {option.selectedSelectionLabel}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(option.price)}
                              </TableCell>
                            </TableRow>
                          );
                        }
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

          {/* Add-ons */}
          {proposal.generalOptions.addons &&
            proposal.generalOptions.addons.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Tambahan
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Tambahan</TableCell>
                        <TableCell align="right">Harga</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proposal.generalOptions.addons.map((addon: any) => {
                        const addonDetails = findOptionDetails(
                          "addon",
                          addon.addonId
                        ) as IAddon;

                        return (
                          <TableRow key={addon.id}>
                            <TableCell>
                              {addonDetails?.label || `Add-on ${addon.addonId}`}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(addon.price)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

          {/* Client Answers */}
          {proposal.generalOptions.answers &&
            proposal.generalOptions.answers.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Jawaban dari Klien
                </Typography>
                {proposal.generalOptions.answers.map((answer: any) => {
                  const questionDetails = findOptionDetails(
                    "question",
                    answer.questionId
                  ) as IQuestion;

                  return (
                    <Box
                      key={answer.id}
                      sx={{
                        mb: 2,
                        bgcolor: "background.default",
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {questionDetails?.text ||
                          `Pertanyaan ${answer.questionId}`}
                      </Typography>
                      <Typography variant="body1">{answer.answer}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
        </CardContent>
      </Card>
    );
  };

  // Render subject options in a more intuitive way
  const renderSubjectOptions = () => {
    if (!proposal.subjectOptions || proposal.subjectOptions.length === 0) {
      return (
        <Typography variant="body2">Tidak ada subjek yang dipilih</Typography>
      );
    }

    return proposal.subjectOptions.map((subject: any) => {
      const subjectDetails = findSubjectDetails(subject.subjectId);

      return (
        <Card key={subject.subjectId} sx={{ mb: 3, overflow: "visible" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {subjectDetails?.title || `Subjek ${subject.subjectId}`}
            </Typography>

            {subject.instances.map((instance: any) => (
              <Box
                key={instance.id}
                sx={{
                  mb: 3,
                  pl: 2,
                  borderLeft: "2px solid",
                  borderColor: "primary.light",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: "medium" }}
                >
                  {subject.instances.length > 1
                    ? `${subjectDetails?.title} #${instance.id}`
                    : ""}
                </Typography>

                {/* Instance Option Groups */}
                {instance.optionGroups && instance.optionGroups.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Opsi
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Opsi</TableCell>
                            <TableCell>Pilihan</TableCell>
                            <TableCell align="right">Harga</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.optionGroups.map((option: any) => {
                            const groupDetails = findSubjectOptionDetails(
                              subject.subjectId,
                              "group",
                              option.groupId
                            ) as IOptionGroup;
                            const selectionDetails = groupDetails
                              ? findSelectionDetails(
                                  groupDetails,
                                  option.selectedSelectionID
                                )
                              : null;

                            return (
                              <TableRow key={option.id}>
                                <TableCell>
                                  {groupDetails?.title ||
                                    `Opsi ${option.groupId}`}
                                </TableCell>
                                <TableCell>
                                  {option.selectedSelectionLabel}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(option.price)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Instance Add-ons */}
                {instance.addons && instance.addons.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Tambahan
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Tambahan</TableCell>
                            <TableCell align="right">Harga</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.addons.map((addon: any) => {
                            const addonDetails = findSubjectOptionDetails(
                              subject.subjectId,
                              "addon",
                              addon.addonId
                            ) as IAddon;

                            return (
                              <TableRow key={addon.id}>
                                <TableCell>
                                  {addonDetails?.label ||
                                    `Tambahan ${addon.addonId}`}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(addon.price)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Instance Client Answers */}
                {instance.answers && instance.answers.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Jawaban Klien
                    </Typography>
                    {instance.answers.map((answer: any) => {
                      const questionDetails = findSubjectOptionDetails(
                        subject.subjectId,
                        "question",
                        answer.questionId
                      ) as IQuestion;

                      return (
                        <Box
                          key={answer.id}
                          sx={{
                            mb: 2,
                            bgcolor: "background.default",
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {questionDetails?.text ||
                              `Pertanyaan ${answer.questionId}`}
                          </Typography>
                          <Typography variant="body1">
                            {answer.answer}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      );
    });
  };

  // Render pricing details section
  const renderPricingDetails = () => (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="h5"
        color="primary"
        sx={{ mb: 3, fontWeight: "medium" }}
      >
        Rincian Harga
      </Typography>

      <TableContainer sx={{ mb: 3 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Harga Dasar</TableCell>
              <TableCell align="right">
                {formatCurrency(proposal.calculatedPrice.base)}
              </TableCell>
            </TableRow>
            {proposal.calculatedPrice.optionGroups > 0 && (
              <TableRow>
                <TableCell>Opsi Tambahan</TableCell>
                <TableCell align="right">
                  {formatCurrency(proposal.calculatedPrice.optionGroups)}
                </TableCell>
              </TableRow>
            )}
            {proposal.calculatedPrice.addons > 0 && (
              <TableRow>
                <TableCell>Add-on</TableCell>
                <TableCell align="right">
                  {formatCurrency(proposal.calculatedPrice.addons)}
                </TableCell>
              </TableRow>
            )}
            {proposal.calculatedPrice.rush > 0 && (
              <TableRow>
                <TableCell>
                  <Tooltip
                    title={`Biaya ekspres untuk ${proposal.rush?.days} hari dipercepat`}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      Biaya Ekspres{" "}
                      <InfoIcon
                        fontSize="small"
                        sx={{ ml: 1, color: "text.secondary" }}
                      />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align="right" sx={{ color: "warning.main" }}>
                  {formatCurrency(proposal.calculatedPrice.rush)}
                </TableCell>
              </TableRow>
            )}
            {proposal.calculatedPrice.discount > 0 && (
              <TableRow>
                <TableCell>Diskon</TableCell>
                <TableCell align="right" sx={{ color: "success.main" }}>
                  -{formatCurrency(proposal.calculatedPrice.discount)}
                </TableCell>
              </TableRow>
            )}
            {proposal.artistAdjustments?.acceptedSurcharge && (
              <TableRow>
                <TableCell>Tambahan dari Ilustrator</TableCell>
                <TableCell align="right" sx={{ color: "error.main" }}>
                  +
                  {formatCurrency(proposal.artistAdjustments.acceptedSurcharge)}
                </TableCell>
              </TableRow>
            )}
            {proposal.artistAdjustments?.acceptedDiscount && (
              <TableRow>
                <TableCell>Diskon dari Ilustrator</TableCell>
                <TableCell align="right" sx={{ color: "success.main" }}>
                  -{formatCurrency(proposal.artistAdjustments.acceptedDiscount)}
                </TableCell>
              </TableRow>
            )}
            <TableRow
              sx={{
                "& td": {
                  fontWeight: "bold",
                  py: 2,
                  borderTop: "1px solid rgba(224, 224, 224, 1)",
                  fontSize: "1.1rem",
                },
              }}
            >
              <TableCell>Total Akhir</TableCell>
              <TableCell align="right">
                {formatCurrency(proposal.calculatedPrice.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  // Render reference images section
  const renderReferenceImages = () => {
    if (!proposal.referenceImages || proposal.referenceImages.length === 0) {
      return null;
    }

    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          color="primary"
          sx={{ mb: 3, fontWeight: "medium" }}
        >
          Gambar Referensi
        </Typography>
        <Grid container spacing={2}>
          {proposal.referenceImages.map((imgUrl: string, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: 3,
                  },
                  borderRadius: 1,
                  overflow: "hidden",
                }}
                onClick={() => setEnlargedImage(imgUrl)}
              >
                <CardMedia
                  component="img"
                  image={imgUrl}
                  alt={`Referensi ${index + 1}`}
                  sx={{
                    height: 200,
                    objectFit: "cover",
                  }}
                />
                <CardContent sx={{ p: 1, bgcolor: "background.default" }}>
                  <Typography variant="caption" color="text.secondary">
                    Gambar Referensi {index + 1}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Image Modal */}
        {enlargedImage && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              p: 4,
            }}
            onClick={() => setEnlargedImage(null)}
          >
            <Box
              component="img"
              src={enlargedImage}
              alt="Enlarged reference"
              sx={{
                maxWidth: "90%",
                maxHeight: "90%",
                objectFit: "contain",
                borderRadius: 1,
              }}
            />
            <IconButton
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.3)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.5)",
                },
              }}
              onClick={() => setEnlargedImage(null)}
            >
              <CancelIcon />
            </IconButton>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <>
      {/* Selected Options */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        {/* Reference Images */}
        {renderReferenceImages()}

        <Typography
          variant="h5"
          color="primary"
          sx={{ mb: 3, fontWeight: "medium" }}
        >
          Opsi yang Dipilih
        </Typography>
        {renderGeneralOptions()}
        {renderSubjectOptions()}
      </Paper>

      {/* Pricing Details */}
      {renderPricingDetails()}
    </>
  );
}
