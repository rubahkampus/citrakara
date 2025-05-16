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
  SelectionInput,
  RevisionPolicyInput,
  MilestoneInput,
  SubjectGroupInput,
} from "../CommissionFormPage";
import { ICommissionListing } from "@/lib/db/models/commissionListing.model";

// A lean interface just for template data
interface TemplateData {
  id: string;
  title: string;
  basePrice: number;
  currency: string;
  slots: number;
  type: "template" | "custom";
  flow: "standard" | "milestone";
  samples?: (File | string)[];
  thumbnailIdx?: number;
  // Description
  description: { title: string; detail: string }[];
  // Deadline
  deadlineMode: "standard" | "withDeadline" | "withRush";
  deadlineMin: number;
  deadlineMax: number;
  rushKind?: "flat" | "perDay";
  rushAmount?: number;
  // Fees
  cancelKind: "flat" | "percentage";
  cancelAmount: number;
  // Revisions
  revisionType: "none" | "standard" | "milestone";
  revLimit?: boolean;
  revFree?: number;
  revExtraAllowed?: boolean;
  revFee?: number;
  // Milestones
  milestones?: MilestoneInput[];
  // Contract
  allowContractChange: boolean;
  changeable: string[];
  // Options
  generalOptions: {
    optionGroups: OptionGroupInput[];
    addons: AddonInput[];
    questions: (string | QuestionInput)[];
  };
  subjectOptions: Array<{
    id?: number;
    title: string;
    limit: number;
    discount: number;
    optionGroups: OptionGroupInput[];
    addons: AddonInput[];
    questions: (string | QuestionInput)[];
  }>;
  // Tags
  tags: string[];
}

// Pre-defined templates with proper typing
const TEMPLATES: TemplateData[] = [
  {
    id: "1",
    title:
      "Furry Anthro Character Commission (Milestone-Deadline-Per-Milestone Revisions)",
    basePrice: 300000,
    currency: "IDR",
    slots: 5,
    type: "template",
    flow: "milestone",
    description: [
      {
        title: "Concept & Sketch",
        detail: "Initial sketch of your character based on your references.",
      },
      { title: "Lineart", detail: "Clean line art of your character." },
      {
        title: "Base Colors",
        detail: "Base colors applied to your character.",
      },
      {
        title: "Shading & Final Details",
        detail: "Shadows, highlights, and final touches.",
      },
    ],
    deadlineMode: "withDeadline",
    deadlineMin: 14,
    deadlineMax: 21,
    cancelKind: "percentage",
    cancelAmount: 20,
    revisionType: "milestone",
    allowContractChange: true,
    changeable: [
      "deadline",
      "generalDescription",
      "referenceImages",
      "generalOptions",
      "subjectOptions",
    ],
    tags: ["furry", "anthro", "character", "milestone"],
    generalOptions: {
      optionGroups: [
        {
          title: "Commercial Usage?",
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
      addons: [{ label: "Twitch Stream", price: 100000 }],
      questions: [
        "What mood do you want for this commission?",
        "Do you have a specific color palette in mind?",
        "What tone would you like for the commission?",
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
              { label: "Half Body", price: 100000 },
              { label: "Full Body", price: 200000 },
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
            label: "NSFW Anatomy (Half Body and Full Body only)",
            price: 50000,
          },
        ],
        questions: [
          "What species is your character and do you have reference images?",
          "Any specific pose or expression desired?",
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
              { label: "Simple Solid Color", price: 0 },
              { label: "Detailed Background", price: 150000 },
            ],
          },
        ],
        addons: [],
        questions: ["What type of background would you like?"],
      },
    ],
    milestones: [
      {
        title: "Concept & Sketch",
        percent: 25,
        policy: {
          limit: true,
          free: 2,
          extraAllowed: true,
          fee: 50000,
        },
      },
      {
        title: "Lineart",
        percent: 25,
        policy: {
          limit: true,
          free: 2,
          extraAllowed: true,
          fee: 50000,
        },
      },
      {
        title: "Base Colors",
        percent: 25,
        policy: {
          limit: true,
          free: 2,
          extraAllowed: true,
          fee: 50000,
        },
      },
      {
        title: "Shading & Final Details",
        percent: 25,
        policy: {
          limit: true,
          free: 2,
          extraAllowed: true,
          fee: 50000,
        },
      },
    ],
  },
  {
    id: "2",
    title: "Furry Chibi (Standard-Rush perDay-No Revisions)",
    basePrice: 150000,
    currency: "IDR",
    slots: 10,
    type: "template",
    flow: "standard",
    description: [
      {
        title: "Chibi Illustration",
        detail:
          "Cute and simple chibi-style illustration of your furry character.",
      },
      {
        title: "Flat Color Style",
        detail:
          "Using solid colors with minimal shading for a minimalist style.",
      },
    ],
    deadlineMode: "withRush",
    deadlineMin: 7,
    deadlineMax: 14,
    rushKind: "perDay",
    rushAmount: 25000,
    cancelKind: "percentage",
    cancelAmount: 30,
    revisionType: "none",
    allowContractChange: true,
    changeable: ["deadline", "generalDescription", "referenceImages"],
    tags: ["furry", "chibi", "flat color"],
    generalOptions: {
      optionGroups: [
        {
          title: "Number of Characters",
          selections: [
            { label: "1 Character", price: 0 },
            { label: "2 Characters", price: 125000 },
            { label: "3 Characters", price: 250000 },
          ],
        },
      ],
      addons: [],
      questions: [
        "Brief character description (species, colors, clothing)",
        "Desired pose or expression?",
      ],
    },
    subjectOptions: [],
  },
  {
    id: "3",
    title: "Furry Scene (Standard-Rush Flat-Standard Revision with Quota)",
    basePrice: 600000,
    currency: "IDR",
    slots: 1,
    type: "custom",
    flow: "standard",
    description: [
      {
        title: "Complex Scene",
        detail:
          "Full scene illustration with furry characters and detailed background.",
      },
      {
        title: "High Quality",
        detail: "Full rendering with shading and lighting effects.",
      },
    ],
    deadlineMode: "withRush",
    deadlineMin: 21,
    deadlineMax: 35,
    rushKind: "flat",
    rushAmount: 300000,
    cancelKind: "flat",
    cancelAmount: 300000,
    revisionType: "standard",
    revLimit: true,
    revFree: 2,
    revExtraAllowed: true,
    revFee: 150000,
    allowContractChange: true,
    changeable: ["deadline", "generalDescription", "referenceImages"],
    tags: ["furry", "scene", "illustration"],
    generalOptions: {
      optionGroups: [
        {
          title: "Art Style",
          selections: [
            { label: "Cartoon", price: 0 },
            { label: "Semi-Realistic", price: 200000 },
            { label: "Anime", price: 100000 },
          ],
        },
      ],
      addons: [
        { label: "Special Effects (fire, water, etc)", price: 150000 },
        { label: "Print-Ready Version", price: 100000 },
      ],
      questions: [
        "Desired atmosphere or mood for the scene?",
        "Time of day in the scene (morning, afternoon, night)?",
      ],
    },
    subjectOptions: [
      {
        title: "Character",
        limit: 5,
        discount: 20,
        optionGroups: [
          {
            title: "Size in Scene",
            selections: [
              { label: "Main Character", price: 200000 },
              { label: "Secondary Character", price: 100000 },
              { label: "Background Character", price: 50000 },
            ],
          },
        ],
        addons: [{ label: "Add Special Detail", price: 50000 }],
        questions: [
          "Character description and position in scene?",
          "Desired interaction between characters?",
        ],
      },
      {
        title: "Setting",
        limit: 1,
        discount: 0,
        optionGroups: [
          {
            title: "Complexity",
            selections: [
              { label: "Simple", price: 0 },
              { label: "Medium", price: 200000 },
              { label: "Complex", price: 400000 },
            ],
          },
        ],
        addons: [{ label: "Custom Architecture", price: 200000 }],
        questions: ["Description of desired setting?"],
      },
    ],
  },
  {
    id: "4",
    title:
      "Furry Reference Sheet (Standard-Standard Deadline-Unlimited Revisions)",
    basePrice: 400000,
    currency: "IDR",
    slots: 3,
    type: "template",
    flow: "standard",
    description: [
      {
        title: "Character Reference Sheet",
        detail:
          "Complete reference sheet for your furry character, including front, side, and back views with full details.",
      },
      {
        title: "Inclusive",
        detail:
          "Includes facial expressions, anatomy details, and color palette.",
      },
    ],
    deadlineMode: "standard",
    deadlineMin: 14,
    deadlineMax: 28,
    cancelKind: "flat",
    cancelAmount: 100000,
    revisionType: "standard",
    revLimit: false,
    revFree: 999,
    revExtraAllowed: false,
    allowContractChange: false,
    changeable: [],
    tags: ["furry", "reference", "sheet"],
    generalOptions: {
      optionGroups: [
        {
          title: "Copyright",
          selections: [
            { label: "Personal Use", price: 0 },
            { label: "Commercial Use", price: 200000 },
          ],
        },
      ],
      addons: [
        { label: "Add Action Pose", price: 150000 },
        { label: "Add Clothing Details", price: 100000 },
      ],
      questions: [
        "What animal is your character?",
        "Do you have references or a description of your character?",
      ],
    },
    subjectOptions: [],
  },
];

export const TemplateSection: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [userTemplates, setUserTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const { reset } = useFormContext<CommissionFormValues>();

  // Helper: convert simple strings or objects to QuestionInput format
  const convertToQuestionInputs = (
    questions: Array<string | QuestionInput>
  ): QuestionInput[] => {
    return questions.map((q, i) => {
      if (typeof q === "string") {
        return { id: i + 1, label: q };
      } else {
        return { id: q.id || i + 1, label: q.label };
      }
    });
  };

  // When a template is selected, build the form values and reset the form
  const onSelect = (tpl: TemplateData) => {
    setSelected(tpl.id);

    const defaults: Partial<CommissionFormValues> = {
      title: tpl.title,
      basePrice: tpl.basePrice,
      currency: tpl.currency,
      slots: tpl.slots,
      type: tpl.type,
      flow: tpl.flow,
      samples: tpl.samples || [],
      thumbnailIdx: tpl.thumbnailIdx !== undefined ? tpl.thumbnailIdx : 0,
      description: tpl.description,
      deadlineMode: tpl.deadlineMode,
      deadlineMin: tpl.deadlineMin,
      deadlineMax: tpl.deadlineMax,
      cancelKind: tpl.cancelKind,
      cancelAmount: tpl.cancelAmount,
      rushKind: tpl.rushKind,
      rushAmount: tpl.rushAmount,
      revisionType: tpl.revisionType,
      revLimit: tpl.revLimit,
      revFree: tpl.revFree,
      revExtraAllowed: tpl.revExtraAllowed,
      revFee: tpl.revFee,
      milestones: tpl.milestones || [],
      allowContractChange: tpl.allowContractChange,
      changeable: tpl.changeable,
      generalOptions: {
        optionGroups: tpl.generalOptions.optionGroups.map((group) => ({
          id: group.id,
          title: group.title,
          selections: group.selections.map((selection, idx) => ({
            id: selection.id || idx + 1,
            label: selection.label,
            price: selection.price,
          })),
        })),
        addons: tpl.generalOptions.addons.map((addon, idx) => ({
          id: addon.id || idx + 1,
          label: addon.label,
          price: addon.price,
        })),
        questions: convertToQuestionInputs(tpl.generalOptions.questions),
      },
      subjectOptions: tpl.subjectOptions.map((subject, subjectIdx) => ({
        id: subject.id || subjectIdx + 1,
        title: subject.title,
        limit: subject.limit,
        discount: subject.discount,
        optionGroups: subject.optionGroups.map((group, groupIdx) => ({
          id: group.id || groupIdx + 1,
          title: group.title,
          selections: group.selections.map((selection, selectionIdx) => ({
            id: selection.id || selectionIdx + 1,
            label: selection.label,
            price: selection.price,
          })),
        })),
        addons: subject.addons.map((addon, addonIdx) => ({
          id: addon.id || addonIdx + 1,
          label: addon.label,
          price: addon.price,
        })),
        questions: convertToQuestionInputs(subject.questions),
      })),
      tags: tpl.tags,
    };

    // Clean up undefined optional fields
    if (!tpl.rushKind) delete defaults.rushKind;
    if (!tpl.rushAmount) delete defaults.rushAmount;
    if (tpl.revisionType !== "standard") {
      delete defaults.revLimit;
      delete defaults.revFree;
      delete defaults.revExtraAllowed;
      delete defaults.revFee;
    }
    if (tpl.flow !== "milestone") {
      delete defaults.milestones;
    }

    reset((prev) => ({ ...prev, ...defaults }));
  };

  // Fetch user-created commissions when the tab is active
  useEffect(() => {
    if (tab !== 1) return;

    setLoading(true);
    axiosClient
      .get("/api/commission/listing")
      .then((res) => {
        const data: TemplateData[] = res.data.listings.map(
          (l: ICommissionListing) => ({
            id: l._id,
            title: l.title,
            type: l.type,
            flow: l.flow,
            basePrice: l.basePrice,
            currency: l.currency || "IDR",
            slots: l.slots || -1,
            samples: l.samples || [],
            thumbnailIdx: l.thumbnailIdx,
            description:
              l.description?.length > 0
                ? l.description
                : [{ title: "Overview", detail: "No description" }],
            deadlineMode: l.deadline.mode,
            deadlineMin: l.deadline.min,
            deadlineMax: l.deadline.max,
            rushKind: l.deadline.rushFee?.kind,
            rushAmount: l.deadline.rushFee?.amount,
            cancelKind: l.cancelationFee.kind,
            cancelAmount: l.cancelationFee.amount,
            revisionType: l.revisions?.type || "none",
            revLimit:
              l.revisions?.type === "standard"
                ? l.revisions.policy?.limit
                : undefined,
            revFree:
              l.revisions?.type === "standard"
                ? l.revisions.policy?.free
                : undefined,
            revExtraAllowed:
              l.revisions?.type === "standard"
                ? l.revisions.policy?.extraAllowed
                : undefined,
            revFee:
              l.revisions?.type === "standard"
                ? l.revisions.policy?.fee
                : undefined,
            milestones:
              l.milestones?.map((m) => ({
                id: m.id,
                title: m.title,
                percent: m.percent,
                policy: m.policy,
              })) || [],
            allowContractChange: l.allowContractChange,
            changeable: l.changeable || [],
            tags: l.tags || [],
            generalOptions: {
              optionGroups:
                l.generalOptions?.optionGroups?.map((g) => ({
                  id: g.id,
                  title: g.title,
                  selections:
                    g.selections?.map((s) => ({
                      id: s.id,
                      label: s.label,
                      price: s.price,
                    })) || [],
                })) || [],
              addons:
                l.generalOptions?.addons?.map((a) => ({
                  id: a.id,
                  label: a.label,
                  price: a.price,
                })) || [],
              questions:
                l.generalOptions?.questions?.map((q) => ({
                  id: q.id,
                  label: q.text,
                })) || [],
            },
            subjectOptions:
              l.subjectOptions?.map((so) => ({
                id: so.id,
                title: so.title,
                limit: so.limit,
                discount: so.discount || 0,
                optionGroups:
                  so.optionGroups?.map((g) => ({
                    id: g.id,
                    title: g.title,
                    selections:
                      g.selections?.map((s) => ({
                        id: s.id,
                        label: s.label,
                        price: s.price,
                      })) || [],
                  })) || [],
                addons:
                  so.addons?.map((a) => ({
                    id: a.id,
                    label: a.label,
                    price: a.price,
                  })) || [],
                questions:
                  so.questions?.map((q) => ({
                    id: q.id,
                    label: q.text,
                  })) || [],
              })) || [],
          })
        );
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
              label={`${tpl.currency} ${tpl.basePrice.toLocaleString()}`}
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
