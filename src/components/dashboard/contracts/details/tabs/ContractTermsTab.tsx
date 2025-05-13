// src/components/dashboard/contracts/tabs/ContractTermsTab.tsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Link as MuiLink,
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
  Chip,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { IContract } from "@/lib/db/models/contract.model";
import {
  IOptionGroup,
  IAddon,
  IQuestion,
} from "@/lib/db/models/commissionListing.model";

interface ContractTermsTabProps {
  contract: IContract;
}

const ContractTermsTab: React.FC<ContractTermsTabProps> = ({ contract }) => {
  const [expandedSection, setExpandedSection] = useState<string | false>(
    "description"
  );

  // Get the current contract terms (the latest one in the array)
  const currentTerms =
    contract.contractTerms[contract.contractTerms.length - 1];
  const proposalSnapshot = contract.proposalSnapshot;
  const listingSnapshot = proposalSnapshot.listingSnapshot;

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

  // Helper to find selection details from a group
  const findSelectionDetails = (groupDetails: any, selectionId: number) => {
    if (!groupDetails || !groupDetails.selections) return null;
    return groupDetails.selections.find(
      (selection: any) => selection.id === selectionId
    );
  };

  // Render general options
  const renderGeneralOptions = () => {
    if (!currentTerms.generalOptions) {
      return <Typography>No options selected</Typography>;
    }

    return (
      <Card sx={{ mb: 3, overflow: "visible" }}>
        <CardContent>
          {/* Option Groups */}
          {currentTerms.generalOptions.optionGroups &&
            currentTerms.generalOptions.optionGroups.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Option Groups
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Option</TableCell>
                        <TableCell>Selection</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentTerms.generalOptions.optionGroups.map(
                        (option) => {
                          const groupDetails = findOptionDetails(
                            "group",
                            option.groupId
                          ) as IOptionGroup;

                          return (
                            <TableRow key={option.id}>
                              <TableCell>
                                {groupDetails?.title ||
                                  `Option Group ${option.groupId}`}
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
          {currentTerms.generalOptions.addons &&
            currentTerms.generalOptions.addons.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Add-ons
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "background.default" }}>
                        <TableCell>Add-on</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentTerms.generalOptions.addons.map((addon) => {
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

          {/* Answers */}
          {currentTerms.generalOptions.answers &&
            currentTerms.generalOptions.answers.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 1, fontWeight: "medium", color: "primary.main" }}
                >
                  Client Responses
                </Typography>
                {currentTerms.generalOptions.answers.map((answer) => {
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
                          `Question ${answer.questionId}`}
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

  // Render subject options
  const renderSubjectOptions = () => {
    if (
      !currentTerms.subjectOptions ||
      currentTerms.subjectOptions.length === 0
    ) {
      return (
        <Typography variant="body2">No subject options selected</Typography>
      );
    }

    return currentTerms.subjectOptions.map((subject) => {
      const subjectDetails = findSubjectDetails(subject.subjectId);

      return (
        <Card key={subject.subjectId} sx={{ mb: 3, overflow: "visible" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              {subjectDetails?.title || `Subject ${subject.subjectId}`}
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
                  Instance {instance.id}
                </Typography>

                {/* Instance Option Groups */}
                {instance.optionGroups && instance.optionGroups.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Options
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Option</TableCell>
                            <TableCell>Selection</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instance.optionGroups.map((option) => {
                            const groupDetails = findSubjectOptionDetails(
                              subject.subjectId,
                              "group",
                              option.groupId
                            ) as IOptionGroup;

                            return (
                              <TableRow key={option.id}>
                                <TableCell>
                                  {groupDetails?.title ||
                                    `Option ${option.groupId}`}
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
                      Add-ons
                    </Typography>
                    <TableContainer
                      component={Paper}
                      variant="outlined"
                      sx={{ borderRadius: 1 }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "background.default" }}>
                            <TableCell>Add-on</TableCell>
                            <TableCell align="right">Price</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
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
                                    `Add-on ${addon.addonId}`}
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

                {/* Instance Answers */}
                {instance.answers && instance.answers.length > 0 && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main" }}
                    >
                      Client Responses
                    </Typography>
                    {instance.answers.map((answer) => {
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
                              `Question ${answer.questionId}`}
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

  return (
    <Box>
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
            <DescriptionIcon sx={{ mr: 1 }} /> Description & References
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography fontWeight="bold" gutterBottom>
            Project Description
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1 }}>
            <Typography>{currentTerms.generalDescription}</Typography>
          </Paper>

          {currentTerms.referenceImages?.length > 0 && (
            <Box mt={2}>
              <Typography fontWeight="bold" gutterBottom>
                Reference Images
              </Typography>
              <Grid container spacing={1}>
                {currentTerms.referenceImages.map((image, index) => (
                  <Grid item key={index} xs={6} sm={4} md={3}>
                    <Box
                      component="img"
                      src={image}
                      alt={`Reference ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expandedSection === "options"}
        onChange={handleSectionToggle("options")}
        sx={{ mb: 2, borderRadius: 1 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Selected Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            variant="subtitle1"
            fontWeight="medium"
            color="primary.main"
            gutterBottom
          >
            General Options
          </Typography>
          {renderGeneralOptions()}

          {currentTerms.subjectOptions &&
            currentTerms.subjectOptions.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  color="primary.main"
                  gutterBottom
                >
                  Subject Options
                </Typography>
                {renderSubjectOptions()}
              </>
            )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ContractTermsTab;
