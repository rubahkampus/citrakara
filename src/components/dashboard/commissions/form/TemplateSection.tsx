// src/components/dashboard/commissions/form/TemplateSection.tsx
"use client";
import React, { useState, useEffect } from "react";
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
import { axiosClient } from "@/lib/utils/axiosClient";
import {
  CommissionFormValues,
  OptionGroupInput,
  AddonInput,
  QuestionInput,
} from "../CommissionFormPage";

// A lean interface just for your template data
interface TemplateData {
  id: string;
  title: string;
  type: "template" | "custom";
  flow: "standard" | "milestone";
  basePrice: number;
  currency: string;
  description: { title: string; detail: string }[];
  deadlineMode: "standard" | "withDeadline" | "withRush";
  deadlineMin: number;
  deadlineMax: number;
  tags: string[];
  generalOptions: {
    optionGroups: OptionGroupInput[];
    addons: AddonInput[];
    // raw strings here
    questions: string[];
  };
  subjectOptions: Array<{
    title: string;
    limit: number;
    discount: number;
    optionGroups: OptionGroupInput[];
    addons: AddonInput[];
    // raw strings
    questions: string[];
  }>;
  milestones?: CommissionFormValues["milestones"];
}
// Mock data with proper typing
const TEMPLATES: TemplateCard[] = [
  {
    id: "1",
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
    milestones: [
      {
        title: "Concept & Sketch",
        percent: 25,
        policy: { limit: true, free: 2, extraAllowed: true, fee: 0 },
      },
      {
        title: "Lineart",
        percent: 25,
        policy: { limit: true, free: 2, extraAllowed: true, fee: 0 },
      },
      {
        title: "Coloring",
        percent: 25,
        policy: { limit: true, free: 2, extraAllowed: true, fee: 0 },
      },
      {
        title: "Final Shading & Details",
        percent: 25,
        policy: { limit: true, free: 2, extraAllowed: true, fee: 0 },
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
  milestones?: {
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

export const TemplateSection: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [userTemplates, setUserTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { reset } = useFormContext<CommissionFormValues>();

  // Helper: turn ["foo","bar"] into [{id:1,label:"foo"},…]
  const mkQuestions = (qs: string[]): QuestionInput[] =>
    qs.map((label, i) => ({ id: i + 1, label }));

  // When you pick a template, build a Partial<CommissionFormValues> and reset()
  const onSelect = (tpl: TemplateData) => {
    setSelected(tpl.id);

    const defaults: Partial<CommissionFormValues> = {
      title: tpl.title,
      basePrice: tpl.basePrice,
      currency: tpl.currency,
      slots: -1,
      type: tpl.type,
      flow: tpl.flow,
      // tos: "",
      samples: [],
      thumbnailIdx: 0,
      description: tpl.description,
      deadlineMode: tpl.deadlineMode,
      deadlineMin: tpl.deadlineMin,
      deadlineMax: tpl.deadlineMax,
      cancelKind: "percentage",
      cancelAmount: 10,
      revisionType: tpl.flow === "milestone" ? "milestone" : "standard",
      milestones: tpl.milestones ?? [],
      allowContractChange: true,
      changeable: [
        "deadline",
        "generalOptions",
        "subjectOptions",
        "description",
        "referenceImages",
      ],
      generalOptions: {
        ...tpl.generalOptions,
        questions: mkQuestions(
          // template.generalOptions.questions is string[]
          (tpl.generalOptions.questions as any[]).map((q) =>
            typeof q === "string" ? q : String(q)
          )
        ),
      },
      subjectOptions: tpl.subjectOptions.map((sub) => ({
        ...sub,
        questions: mkQuestions(
          (sub.questions as any[]).map((q) =>
            typeof q === "string" ? q : String(q)
          )
        ),
      })),
      tags: tpl.tags,
    };

    reset((prev) => ({ ...prev, ...defaults }));
  };

  // Fetch user-created commissions only when that tab is active
  useEffect(() => {
    if (tab !== 1) return;
    setLoading(true);
    axiosClient
      .get("/api/commission/listing")
      .then((res) => {
        const data: TemplateData[] = res.data.listings.map((l: any) => ({
          id: l._id,
          title: l.title,
          type: l.type,
          flow: l.flow,
          basePrice: l.basePrice,
          currency: l.currency,
          description:
            l.description?.length > 0
              ? l.description
              : [{ title: "Overview", detail: "No description" }],
          deadlineMode: l.deadline.mode,
          deadlineMin: l.deadline.min,
          deadlineMax: l.deadline.max,
          tags: l.tags || [],
          generalOptions: l.generalOptions || {
            optionGroups: [],
            addons: [],
            questions: [],
          },
          subjectOptions: l.subjectOptions || [],
          milestones: l.milestones,
        }));
        setUserTemplates(data);
        setError(null);
      })
      .catch((e) => {
        setError(e.response?.data?.error || "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const renderCard = (tpl: TemplateData) => (
    <Card
      key={tpl.id}
      sx={{
        mb: 2,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 3 },
        border: selected === tpl.id ? 2 : 1,
        borderColor: selected === tpl.id ? "primary.main" : "divider",
      }}
    >
      <CardActionArea onClick={() => onSelect(tpl)}>
        <CardContent>
          <Typography variant="h6">{tpl.title}</Typography>
          <Stack direction="row" spacing={1} sx={{ my: 1 }}>
            <Chip label={tpl.type} size="small" />
            <Chip label={tpl.flow} size="small" />
            <Chip
              label={`IDR ${tpl.basePrice.toLocaleString()}`}
              size="small"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {tpl.description[0].detail}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {tpl.tags.map((t) => (
              <Chip key={t} label={t} size="small" />
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold">
        Start From Template
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Choose a starting point or start from scratch
      </Typography>
      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setSelected(null);
          }}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Templates" />
          <Tab label="Your Commissions" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 ? (
            <Grid container spacing={2}>
              {TEMPLATES.map((tpl) => (
                <Grid key={tpl.id} item xs={12} md={6}>
                  {renderCard(tpl)}
                </Grid>
              ))}
            </Grid>
          ) : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : userTemplates.length > 0 ? (
            <Grid container spacing={2}>
              {userTemplates.map((tpl) => (
                <Grid key={tpl.id} item xs={12} md={6}>
                  {renderCard(tpl)}
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              You haven't created any commissions yet.
            </Alert>
          )}
        </Box>
      </Paper>
      {selected && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Template values loaded! You can now customize them below.
        </Alert>
      )}
    </Box>
  );
};

export default TemplateSection;
