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
      "Komisi Karakter Anthro Furry (Milestone-Tenggat-Per-Milestone Revisi)",
    basePrice: 300000,
    currency: "IDR",
    slots: 5,
    type: "template",
    flow: "milestone",
    description: [
      {
        title: "Konsep & Sketsa",
        detail:
          "Sketsa awal karakter Anda berdasarkan referensi yang diberikan.",
      },
      { title: "Lineart", detail: "Garis bersih karakter Anda." },
      {
        title: "Warna Dasar",
        detail: "Warna dasar diaplikasikan pada karakter Anda.",
      },
      {
        title: "Shading & Detail Akhir",
        detail: "Bayangan, highlight, dan sentuhan akhir.",
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
    tags: ["furry", "anthro", "karakter", "milestone"],
    generalOptions: {
      optionGroups: [
        {
          title: "Penggunaan Komersial?",
          selections: [
            { label: "Tidak", price: 0 },
            { label: "Ya", price: 50000 },
          ],
        },
        {
          title: "Posting Publik?",
          selections: [
            { label: "Tidak", price: 0 },
            { label: "Ya", price: 50000 },
          ],
        },
      ],
      addons: [{ label: "Streaming Twitch", price: 100000 }],
      questions: [
        "Mood apa yang Anda inginkan untuk komisi ini?",
        "Apakah Anda memiliki palet warna tertentu dalam pikiran?",
        "Nada seperti apa yang Anda inginkan untuk komisi ini?",
      ],
    },
    subjectOptions: [
      {
        title: "Karakter",
        limit: 3,
        discount: 50,
        optionGroups: [
          {
            title: "Tipe Tampilan",
            selections: [
              { label: "Headshot", price: 0 },
              { label: "Setengah Badan", price: 100000 },
              { label: "Badan Penuh", price: 200000 },
            ],
          },
          {
            title: "Pakaian?",
            selections: [
              { label: "Tidak", price: 20000 },
              { label: "Ya", price: 50000 },
            ],
          },
        ],
        addons: [
          {
            label: "Anatomi NSFW (hanya untuk Setengah Badan dan Badan Penuh)",
            price: 50000,
          },
        ],
        questions: [
          "Apa jenis/spesies karakter Anda dan apakah Anda memiliki gambar referensi?",
          "Ada pose atau ekspresi tertentu yang diinginkan?",
        ],
      },
      {
        title: "Latar Belakang",
        limit: 1,
        discount: 0,
        optionGroups: [
          {
            title: "Tingkat Detail",
            selections: [
              { label: "Warna Solid Sederhana", price: 0 },
              { label: "Latar Belakang Detail", price: 150000 },
            ],
          },
        ],
        addons: [],
        questions: ["Tipe latar belakang seperti apa yang Anda inginkan?"],
      },
    ],
    milestones: [
      {
        title: "Konsep & Sketsa",
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
        title: "Warna Dasar",
        percent: 25,
        policy: {
          limit: true,
          free: 2,
          extraAllowed: true,
          fee: 50000,
        },
      },
      {
        title: "Shading & Detail Akhir",
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
    title: "Furry Chibi (Standar-Rush perHari-Tanpa Revisi)",
    basePrice: 150000,
    currency: "IDR",
    slots: 10,
    type: "template",
    flow: "standard",
    description: [
      {
        title: "Ilustrasi Chibi",
        detail:
          "Ilustrasi gaya chibi yang lucu dan sederhana untuk karakter furry Anda.",
      },
      {
        title: "Gaya Warna Datar",
        detail:
          "Menggunakan warna solid dengan shading minimal untuk gaya minimalis.",
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
    tags: ["furry", "chibi", "warna datar"],
    generalOptions: {
      optionGroups: [
        {
          title: "Jumlah Karakter",
          selections: [
            { label: "1 Karakter", price: 0 },
            { label: "2 Karakter", price: 125000 },
            { label: "3 Karakter", price: 250000 },
          ],
        },
      ],
      addons: [],
      questions: [
        "Deskripsi singkat karakter (spesies, warna, pakaian)",
        "Pose atau ekspresi yang diinginkan?",
      ],
    },
    subjectOptions: [],
  },
  {
    id: "3",
    title: "Adegan Furry (Standar-Rush Flat-Revisi Standar dengan Kuota)",
    basePrice: 600000,
    currency: "IDR",
    slots: 1,
    type: "custom",
    flow: "standard",
    description: [
      {
        title: "Adegan Kompleks",
        detail:
          "Ilustrasi adegan lengkap dengan karakter furry dan latar belakang detail.",
      },
      {
        title: "Kualitas Tinggi",
        detail: "Rendering penuh dengan efek shading dan pencahayaan.",
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
    tags: ["furry", "adegan", "ilustrasi"],
    generalOptions: {
      optionGroups: [
        {
          title: "Gaya Seni",
          selections: [
            { label: "Kartun", price: 0 },
            { label: "Semi-Realistis", price: 200000 },
            { label: "Anime", price: 100000 },
          ],
        },
      ],
      addons: [
        { label: "Efek Khusus (api, air, dll)", price: 150000 },
        { label: "Versi Siap Cetak", price: 100000 },
      ],
      questions: [
        "Atmosfer atau suasana yang diinginkan untuk adegan?",
        "Waktu hari dalam adegan (pagi, siang, malam)?",
      ],
    },
    subjectOptions: [
      {
        title: "Karakter",
        limit: 5,
        discount: 20,
        optionGroups: [
          {
            title: "Ukuran dalam Adegan",
            selections: [
              { label: "Karakter Utama", price: 200000 },
              { label: "Karakter Sekunder", price: 100000 },
              { label: "Karakter Latar Belakang", price: 50000 },
            ],
          },
        ],
        addons: [{ label: "Tambah Detail Khusus", price: 50000 }],
        questions: [
          "Deskripsi karakter dan posisi dalam adegan?",
          "Interaksi yang diinginkan antar karakter?",
        ],
      },
      {
        title: "Latar",
        limit: 1,
        discount: 0,
        optionGroups: [
          {
            title: "Kompleksitas",
            selections: [
              { label: "Sederhana", price: 0 },
              { label: "Menengah", price: 200000 },
              { label: "Kompleks", price: 400000 },
            ],
          },
        ],
        addons: [{ label: "Arsitektur Kustom", price: 200000 }],
        questions: ["Deskripsi latar yang diinginkan?"],
      },
    ],
  },
  {
    id: "4",
    title:
      "Lembar Referensi Furry (Standar-Tenggat Standar-Revisi Tidak Terbatas)",
    basePrice: 400000,
    currency: "IDR",
    slots: 3,
    type: "template",
    flow: "standard",
    description: [
      {
        title: "Lembar Referensi Karakter",
        detail:
          "Lembar referensi lengkap untuk karakter furry Anda, termasuk tampilan depan, samping, dan belakang dengan detail lengkap.",
      },
      {
        title: "Inklusif",
        detail: "Termasuk ekspresi wajah, detail anatomi, dan palet warna.",
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
    tags: ["furry", "referensi", "lembar"],
    generalOptions: {
      optionGroups: [
        {
          title: "Hak Cipta",
          selections: [
            { label: "Penggunaan Pribadi", price: 0 },
            { label: "Penggunaan Komersial", price: 200000 },
          ],
        },
      ],
      addons: [
        { label: "Tambah Pose Aksi", price: 150000 },
        { label: "Tambah Detail Pakaian", price: 100000 },
      ],
      questions: [
        "Hewan apa karakter Anda?",
        "Apakah Anda memiliki referensi atau deskripsi karakter Anda?",
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
        Mulai Dari Template
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Pilih template atau mulai dari awal
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
          <Tab label="Template" />
          <Tab label="Komisi Sebelumnya" />
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
            <Alert severity="info">Kamu belum mempunyai komisi.</Alert>
          )}
        </Box>
      </Paper>
      {selected && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Template telah dimuat! Kamu dapat mengubahnya di bawah.
        </Alert>
      )}
    </Box>
  );
};

export default TemplateSection;
