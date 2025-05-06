// src/components/dashboard/commissions/form/TemplateSection.tsx
"use client";
import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Divider,
  Paper,
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useFormContext } from "react-hook-form";
import { CommissionFormValues } from "../CommissionFormPage";
import { useEffect } from "react";
import { axiosClient } from "@/lib/utils/axiosClient";

// Mock data with proper typing
const TEMPLATES: TemplateCard[] = [
  {
    id: "furry_milestone",
    title: "Anthro Furry Character Commission",
    type: "template",
    flow: "milestone",
    basePrice: 300000,
    description: [
      {
        title: "Concept & Sketch",
        detail: "Initial character sketch based on your references.",
      },
      { title: "Lineart", detail: "Clean lineart of your character." },
      { title: "Coloring", detail: "Base colors applied to your character." },
      {
        title: "Final Shading & Details",
        detail: "Shading, highlights, and final touches.",
      },
    ],
    deadlineMode: "withDeadline",
    deadlineMin: 14,
    deadlineMax: 21,
    currency: "IDR",
    tags: ["furry", "anthro", "character", "milestone"],
    generalOptions: {
      optionGroups: [
        {
          title: "Commercial Use?",
          selections: [
            { label: "No", price: 0 },
            { label: "Yes", price: 50000 },
          ],
        },
        {
          title: "Public Posting?",
          selections: [
            { label: "No", price: 0 },
            { label: "Yes", price: 50000 },
          ],
        },
      ],
      addons: [{ label: "Sream on Twitch", price: 100000 }],
      questions: [
        "What is your mood for this commission?",
        "Do you have any specific color palette in mind?",
        "What is the vibe of the commission?",
      ],
    },
    subjectOptions: [
      {
        title: "Character",
        limit: 3,
        discount: 50,
        optionGroups: [
          {
            title: "View Type",
            selections: [
              { label: "Headshot", price: 0 },
              { label: "Half-body", price: 100000 },
              { label: "Full-body", price: 200000 },
            ],
          },
          {
            title: "Clothing?",
            selections: [
              { label: "No", price: 20000 },
              { label: "Yes", price: 50000 },
            ],
          },
        ],
        addons: [
          {
            label: "NSFW Anatomy (For Half-body and Full-body only)",
            price: 50000,
          },
        ],
        questions: [
          "What is the species of the character and do you have reference images?",
          "Any preferred pose or expression?",
        ],
      },
      {
        title: "Background",
        limit: 1,
        discount: 0,
        optionGroups: [
          {
            title: "Detail Level",
            selections: [
              { label: "Simple Flat Color", price: 0 },
              { label: "Detailed Background", price: 150000 },
            ],
          },
        ],
        addons: [],
        questions: ["What kind of background do you have in mind?"],
      },
    ],
    defaultMilestones: [
      {
        title: "Concept & Sketch",
        percent: 25,
        policy: { limit: false, free: 2, extraAllowed: true, fee: 0 },
      },
      {
        title: "Lineart",
        percent: 25,
        policy: { limit: false, free: 2, extraAllowed: true, fee: 0 },
      },
      {
        title: "Coloring",
        percent: 25,
        policy: { limit: false, free: 2, extraAllowed: true, fee: 0 },
      },
      {
        title: "Final Shading & Details",
        percent: 25,
        policy: { limit: false, free: 2, extraAllowed: true, fee: 0 },
      },
    ],
  },
];

interface TemplateCard {
  id: string;
  title: string;
  type: "template" | "custom";
  flow: "standard" | "milestone";
  basePrice: number;
  description: Array<{ title: string; detail: string }>;
  deadlineMode: "standard" | "withDeadline" | "withRush";
  deadlineMin: number;
  deadlineMax: number;
  currency: string;
  tags: string[];
  generalOptions: {
    optionGroups: Array<{
      title: string;
      selections: Array<{ label: string; price: number }>;
    }>;
    addons: Array<{ label: string; price: number }>;
    questions: string[];
  };
  subjectOptions: Array<{
    title: string;
    limit: number;
    discount: number;
    optionGroups: Array<{
      title: string;
      selections: Array<{ label: string; price: number }>;
    }>;
    addons: Array<{ label: string; price: number }>;
    questions: string[];
  }>;
  defaultMilestones?: {
    title: string;
    percent: number;
    policy: {
      limit: boolean;
      free: number;
      extraAllowed: boolean;
      fee: number;
    };
  }[];
}

const TemplateSection: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCommissions, setUserCommissions] = useState<TemplateCard[]>([]);
  const { reset } = useFormContext<CommissionFormValues>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: TemplateCard) => {
    setSelectedTemplate(template.id);

    // Format general options questions to match expected structure
    const formattedGeneralOptions = {
      ...template.generalOptions,
      // Convert simple string questions to objects with 'text' property
      questions: template.generalOptions.questions.map((q: string | { title: string }) => {
        if (typeof q === "string") {
          return q;
        } else if (typeof q === "object" && q.title) {
          return q.title;
        } else {
          return String(q);
        }
      }),
      optionGroups: template.generalOptions.optionGroups.map((group) => ({
        ...group,
        selections: group.selections.map((selection) => ({
          ...selection,
          // Ensure numeric values for prices
          price: Number(selection.price),
        })),
      })),
      addons: template.generalOptions.addons.map((addon) => ({
        ...addon,
        // Ensure numeric values for prices
        price: Number(addon.price),
      })),
    };

    // Format subject options similarly
    const formattedSubjectOptions = template.subjectOptions.map((subject) => ({
      ...subject,
      // Convert subject question strings to objects with 'text' property
      questions: subject.questions.map((q: string | { title: string }) => {
        if (typeof q === "string") {
          return q;
        } else if (typeof q === "object" && q.title) {
          return q.title;
        } else {
          return String(q);
        }
      }),
      optionGroups: subject.optionGroups.map((group) => ({
        ...group,
        selections: group.selections.map((selection) => ({
          ...selection,
          price: Number(selection.price),
        })),
      })),
      addons: subject.addons.map((addon) => ({
        ...addon,
        price: Number(addon.price),
      })),
    }));

    // Create a properly typed partial form values object
    const newValues: Partial<CommissionFormValues> = {
      title: template.title,
      type: template.type,
      flow: template.flow,
      basePrice: template.basePrice,
      currency: template.currency,
      description: template.description,
      deadlineMode: template.deadlineMode,
      deadlineMin: template.deadlineMin,
      deadlineMax: template.deadlineMax,
      tags: template.tags,
      // Keep existing samples and thumbnail
      samples: [],
      thumbnailIdx: 0,
      // Set some sensible defaults
      slots: -1,
      revisionType: template.flow === "milestone" ? "milestone" : "standard",
      // now actually load the milestones you defined
      milestones: template.defaultMilestones ?? [],
      cancelKind: "percentage",
      cancelAmount: 10,
      allowContractChange: true,
      changeable: [
        "deadline",
        "generalOptions",
        "subjectOptions",
        "description",
        "referenceImages",
      ],
      generalOptions: formattedGeneralOptions,
      subjectOptions: formattedSubjectOptions,
    };

    // Reset form with merged values
    reset((formValues) => ({
      ...formValues,
      ...newValues,
    }));
  };

  // Fetch user commissions
  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get("/api/commission/listing");

        // Transform API response to match TemplateCard interface
        const transformed: TemplateCard[] = response.data.listings.map(
          (listing: any) => ({
            id: listing._id,
            title: listing.title,
            type: listing.type,
            flow: listing.flow,
            basePrice: listing.basePrice,
            description: listing.description || [
              {
                title: "Overview",
                detail:
                  listing.description?.[0]?.detail ||
                  "No description available",
              },
            ],
            deadlineMode: listing.deadline.mode,
            deadlineMin: listing.deadline.min,
            deadlineMax: listing.deadline.max,
            currency: listing.currency,
            tags: listing.tags,
            generalOptions: listing.generalOptions || {
              optionGroups: [],
              addons: [],
              questions: [],
            },
            subjectOptions: listing.subjectOptions || [],
            defaultMilestones: listing.milestones,
          })
        );

        setUserCommissions(transformed);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Failed to load your commissions"
        );
        console.error("Error fetching commissions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedTab === 1) {
      // Only fetch when "Your Commissions" tab is selected
      fetchCommissions();
    }
  }, [selectedTab]);

  const renderTemplateCard = (template: TemplateCard) => (
    <Card
      key={template.id}
      sx={{
        mb: 2,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 3,
        },
        border: selectedTemplate === template.id ? 2 : 1,
        borderColor:
          selectedTemplate === template.id ? "primary.main" : "divider",
      }}
    >
      <CardActionArea onClick={() => handleTemplateSelect(template)}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {template.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={template.type === "template" ? "Template" : "Custom"}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={template.flow === "standard" ? "Standard" : "Milestone"}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${
                template.currency
              } ${template.basePrice.toLocaleString()}`}
              size="small"
              variant="outlined"
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {template.description[0].detail}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {template.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ mb: 0.5 }} />
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Start From Template
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Choose a starting point for your commission or start from scratch
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Templates" />
          <Tab label="Your Commissions" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {selectedTab === 0 ? (
            <Grid container spacing={2}>
              {TEMPLATES.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  {renderTemplateCard(template)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={2}>
              {loading ? (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                </Grid>
              ) : error ? (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              ) : userCommissions.length > 0 ? (
                userCommissions.map((commission) => (
                  <Grid item xs={12} md={6} key={commission.id}>
                    {renderTemplateCard(commission)}
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    You haven't created any commissions yet. Templates are a
                    great way to get started!
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Paper>

      {selectedTemplate && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Template values loaded! You can now customize them in the sections
          below.
        </Alert>
      )}
    </Box>
  );
};

export default TemplateSection;
