// src/components/dashboard/contracts/tabs/ContractTermsTab.tsx
import React, { useState } from "react";

// MUI Components
import {
  Box,
  Typography,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
} from "@mui/material";

// MUI Icons
import {
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

// Types
import { IContract } from "@/lib/db/models/contract.model";
import {
  IOptionGroup,
  IAddon,
  IQuestion,
} from "@/lib/db/models/commissionListing.model";

// Interfaces
interface ContractTermsTabProps {
  contract: IContract;
}

/**
 * ContractTermsTab component displays the terms and details of a contract
 */
const ContractTermsTab: React.FC<ContractTermsTabProps> = ({ contract }) => {
  const [expandedSection, setExpandedSection] = useState<string | false>(
    "description"
  );

  // Get the current contract terms (the latest one in the array)
  const currentTerms =
    contract.contractTerms[contract.contractTerms.length - 1];
  const proposalSnapshot = contract.proposalSnapshot;
  const listingSnapshot = proposalSnapshot.listingSnapshot;

  // ==== Helper Functions ====

  // Handle section expansion
  const handleSectionToggle =
    (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? section : false);
    };

  // Format currency helper
  const formatCurrency = (amount: number) => `IDR ${amount.toLocaleString()}`;

  // Format date helper with time
  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==== Data Lookup Helpers ====

  // Helper to find option group, selection, or addon details from the listing snapshot
  const findOptionDetails = (type: string, id: number) => {
    if (type === "group") {
      return listingSnapshot.generalOptions?.optionGroups?.find(
        (group) => group.id === id
      );
    } else if (type === "addon") {
      return listingSnapshot.generalOptions?.addons?.find(
        (addon) => addon.id === id
      );
    } else if (type === "question") {
      return listingSnapshot.generalOptions?.questions?.find(
        (question) => question.id === id
      );
    }
    return null;
  };

  // Helper to find subject option details from the listing snapshot
  const findSubjectDetails = (subjectId: number) => {
    return listingSnapshot.subjectOptions?.find(
      (subject) => subject.id === subjectId
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
      return subject.optionGroups?.find((group) => group.id === id);
    } else if (type === "addon") {
      return subject.addons?.find((addon) => addon.id === id);
    } else if (type === "question") {
      return subject.questions?.find((question) => question.id === id);
    }
    return null;
  };

  // ==== UI Components ====

  // Component: Section Headers
  const SectionHeader: React.FC<{
    title: string;
    icon?: React.ReactNode;
    color?: string;
  }> = ({ title, icon, color = "primary.main" }) => (
    <Typography
      variant="subtitle1"
      sx={{
        mb: 1,
        fontWeight: "medium",
        color,
        display: "flex",
        alignItems: "center",
      }}
    >
      {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
      {title}
    </Typography>
  );

  // Component: Data Table
  const DataTable: React.FC<{
    headers: string[];
    alignRight?: boolean[];
    children: React.ReactNode;
  }> = ({ headers, alignRight = [], children }) => (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 1, mb: 3 }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "background.default" }}>
            {headers.map((header, index) => (
              <TableCell
                key={index}
                align={alignRight?.at(index) ? "right" : "left"}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );

  // Component: Response Box
  const ResponseBox: React.FC<{
    question: string;
    answer: string;
  }> = ({ question, answer }) => (
    <Box
      sx={{
        mb: 2,
        bgcolor: "background.default",
        p: 2,
        borderRadius: 1,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {question}
      </Typography>
      <Typography variant="body1">{answer}</Typography>
    </Box>
  );

  // ==== Content Rendering Functions ====

  // Render general options
  const renderGeneralOptions = () => {
    if (!currentTerms.generalOptions) {
      return <Typography>Tidak ada opsi yang dipilih</Typography>;
    }

    return (
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent>
          {/* Option Groups */}
          {currentTerms.generalOptions.optionGroups &&
            currentTerms.generalOptions.optionGroups.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <SectionHeader title="Kelompok Opsi" />
                <DataTable
                  headers={["Opsi", "Pilihan", "Harga"]}
                  alignRight={[false, false, true]}
                >
                  {currentTerms.generalOptions.optionGroups.map((option) => {
                    const groupDetails = findOptionDetails(
                      "group",
                      option.groupId
                    ) as IOptionGroup;

                    return (
                      <TableRow key={option.id}>
                        <TableCell>
                          {groupDetails?.title || `Opsi ${option.groupId}`}
                        </TableCell>
                        <TableCell>{option.selectedSelectionLabel}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(option.price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </DataTable>
              </Box>
            )}

          {/* Add-ons */}
          {currentTerms.generalOptions.addons &&
            currentTerms.generalOptions.addons.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <SectionHeader title="Tambahan" />
                <DataTable
                  headers={["Tambahan", "Harga"]}
                  alignRight={[false, true]}
                >
                  {currentTerms.generalOptions.addons.map((addon) => {
                    const addonDetails = findOptionDetails(
                      "addon",
                      addon.addonId
                    ) as IAddon;

                    return (
                      <TableRow key={addon.id}>
                        <TableCell>
                          {addonDetails?.label || `Tambahan ${addon.addonId}`}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(addon.price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </DataTable>
              </Box>
            )}

          {/* Answers */}
          {currentTerms.generalOptions.answers &&
            currentTerms.generalOptions.answers.length > 0 && (
              <Box>
                <SectionHeader title="Respon Klien" />
                {currentTerms.generalOptions.answers.map((answer) => {
                  const questionDetails = findOptionDetails(
                    "question",
                    answer.questionId
                  ) as IQuestion;

                  return (
                    <ResponseBox
                      key={answer.id}
                      question={
                        questionDetails?.text ||
                        `Pertanyaan ${answer.questionId}`
                      }
                      answer={answer.answer}
                    />
                  );
                })}
              </Box>
            )}
        </CardContent>
      </Card>
    );
  };

  // Render subject options
  const renderSubjectOptions = () => {
    if (
      !currentTerms.subjectOptions ||
      currentTerms.subjectOptions.length === 0
    ) {
      return (
        <Typography variant="body2">
          Tidak ada opsi subjek yang dipilih
        </Typography>
      );
    }

    return currentTerms.subjectOptions.map((subject) => {
      const subjectDetails = findSubjectDetails(subject.subjectId);

      return (
        <Card key={subject.subjectId} sx={{ mb: 3, overflow: "visible" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {subjectDetails?.title || `Subjek ${subject.subjectId}`}
            </Typography>

            {subject.instances.map((instance) => (
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
                  Instansi {instance.id}
                </Typography>

                {/* Instance Option Groups */}
                {instance.optionGroups && instance.optionGroups.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <SectionHeader title="Opsi" color="primary.main" />
                    <DataTable
                      headers={["Opsi", "Pilihan", "Harga"]}
                      alignRight={[false, false, true]}
                    >
                      {instance.optionGroups.map((option) => {
                        const groupDetails = findSubjectOptionDetails(
                          subject.subjectId,
                          "group",
                          option.groupId
                        ) as IOptionGroup;

                        return (
                          <TableRow key={option.id}>
                            <TableCell>
                              {groupDetails?.title || `Opsi ${option.groupId}`}
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
                    </DataTable>
                  </Box>
                )}

                {/* Instance Add-ons */}
                {instance.addons && instance.addons.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <SectionHeader title="Tambahan" color="primary.main" />
                    <DataTable
                      headers={["Tambahan", "Harga"]}
                      alignRight={[false, true]}
                    >
                      {instance.addons.map((addon) => {
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
                    </DataTable>
                  </Box>
                )}

                {/* Instance Answers */}
                {instance.answers && instance.answers.length > 0 && (
                  <Box>
                    <SectionHeader title="Respon Klien" color="primary.main" />
                    {instance.answers.map((answer) => {
                      const questionDetails = findSubjectOptionDetails(
                        subject.subjectId,
                        "question",
                        answer.questionId
                      ) as IQuestion;

                      return (
                        <ResponseBox
                          key={answer.id}
                          question={
                            questionDetails?.text ||
                            `Pertanyaan ${answer.questionId}`
                          }
                          answer={answer.answer}
                        />
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

  // ==== Main Component ====

  return (
    <Box>
      {/* Description & References Accordion */}
      <Accordion
        expanded={expandedSection === "description"}
        onChange={handleSectionToggle("description")}
        sx={{ mb: 2, borderRadius: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <DescriptionIcon sx={{ mr: 1 }} /> Deskripsi & Referensi
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography fontWeight="bold" gutterBottom>
            Deskripsi Proyek
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1 }}>
            <Typography>{currentTerms.generalDescription}</Typography>
          </Paper>

          {currentTerms.referenceImages?.length > 0 && (
            <Box mt={2}>
              <Typography fontWeight="bold" gutterBottom>
                Gambar Referensi
              </Typography>
              <Grid container spacing={1}>
                {currentTerms.referenceImages.map((image, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Box
                      component="img"
                      src={image}
                      alt={`Referensi ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1,
                        boxShadow: 1,
                        transition: "transform 0.2s",
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Options Accordion */}
      <Accordion
        expanded={expandedSection === "options"}
        onChange={handleSectionToggle("options")}
        sx={{ mb: 2, borderRadius: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <SettingsIcon sx={{ mr: 1 }} /> Opsi yang Dipilih
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SectionHeader title="Opsi Umum" color="primary.main" />
          {renderGeneralOptions()}

          {currentTerms.subjectOptions &&
            currentTerms.subjectOptions.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <SectionHeader title="Opsi Subjek" color="primary.main" />
                {renderSubjectOptions()}
              </>
            )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ContractTermsTab;
