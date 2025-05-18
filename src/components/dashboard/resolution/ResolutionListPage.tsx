"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Badge,
  useTheme,
  Divider,
} from "@mui/material";
import {
  Gavel as GavelIcon,
  Send as SentIcon,
  Inbox as InboxIcon,
  AccessTime as PendingIcon,
  Visibility as VisibilityIcon,
  CheckCircle as ResolvedIcon,
} from "@mui/icons-material";

import { IResolutionTicket } from "@/lib/db/models/ticket.model";
import ResolutionListTable from "./ResolutionListTable";
import ResolutionListSkeleton from "./ResolutionListSkeleton";

// Constants for tab categories and their configurations
const TAB_CATEGORIES = [
  {
    id: "all",
    label: "Semua",
    icon: GavelIcon,
    color: "primary",
    filter: () => true,
  },
  {
    id: "submitted",
    label: "Dikirim",
    icon: SentIcon,
    color: "secondary",
    filter: (ticket: IResolutionTicket, userId: string) =>
      ticket.submittedById.toString() === userId,
  },
  {
    id: "responding",
    label: "Merespon",
    icon: InboxIcon,
    color: "info",
    filter: (ticket: IResolutionTicket, userId: string) =>
      ticket.submittedById.toString() !== userId,
  },
  {
    id: "open",
    label: "Terbuka",
    icon: PendingIcon,
    color: "primary",
    filter: (ticket: IResolutionTicket) => ticket.status === "open",
  },
  {
    id: "awaiting",
    label: "Menunggu Tinjauan",
    icon: VisibilityIcon,
    color: "warning",
    filter: (ticket: IResolutionTicket) => ticket.status === "awaitingReview",
  },
  {
    id: "resolved",
    label: "Terselesaikan",
    icon: ResolvedIcon,
    color: "success",
    filter: (ticket: IResolutionTicket) => ticket.status === "resolved",
  },
];

// Types for the props
interface ResolutionListPageProps {
  username: string;
  tickets: IResolutionTicket[];
  userId: string;
  loading?: boolean;
}

export default function ResolutionListPage({
  username,
  tickets,
  userId,
  loading = false,
}: ResolutionListPageProps) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [filteredTickets, setFilteredTickets] = useState<IResolutionTicket[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter tickets based on the selected tab
  useEffect(() => {
    const activeTab = TAB_CATEGORIES[tabValue];
    const filtered = tickets.filter((ticket) =>
      typeof activeTab.filter === "function"
        ? activeTab.filter(ticket, userId)
        : true
    );
    setFilteredTickets(filtered);
  }, [tabValue, tickets, userId]);

  // Calculate counts for each tab category
  const countByCategory = TAB_CATEGORIES.reduce((counts, category) => {
    counts[category.id] = tickets.filter((ticket) =>
      typeof category.filter === "function"
        ? category.filter(ticket, userId)
        : true
    ).length;
    return counts;
  }, {} as Record<string, number>);

  if (loading) {
    return <ResolutionListSkeleton />;
  }

  // Render tab with badge
  const renderTabWithBadge = (
    category: (typeof TAB_CATEGORIES)[0],
    index: number
  ) => {
    const Icon = category.icon;

    return (
      <Tab
        key={category.id}
        label={
          <Badge
            badgeContent={countByCategory[category.id]}
            color={category.color as any}
            max={99}
            showZero
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.7rem",
                height: "18px",
                minWidth: "18px",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                transition: "all 0.2s",
              }}
            >
              <Icon
                sx={{
                  mr: 0.5,
                  fontSize: 18
                }}
              />
              <span style={{ marginRight: 8 }}>{category.label}</span>
            </Box>
          </Badge>
        }
        sx={{
          minHeight: "48px",
          opacity: 1,
          "&.Mui-selected": {
            fontWeight: "medium",
          },
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      />
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
          boxShadow: theme.shadows[1],
          transition: "box-shadow 0.3s",
          "&:hover": {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTabs-indicator": {
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            },
          }}
        >
          {TAB_CATEGORIES.map((category, index) =>
            renderTabWithBadge(category, index)
          )}
        </Tabs>
      </Paper>

      <ResolutionListTable
        tickets={filteredTickets}
        username={username}
        userId={userId}
        emptyMessage={`Tidak ada tiket resolusi dalam kategori ini.`}
      />

      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 2,
          mt: 4,
          bgcolor: "background.paper",
          "&:hover": {
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <Typography
          variant="subtitle1"
          color="primary"
          gutterBottom
          fontWeight="medium"
        >
          Tentang Resolusi Sengketa
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Tiket resolusi digunakan untuk menyelesaikan sengketa antara klien dan
          seniman ketika terjadi ketidaksepakatan tentang hasil kerja atau
          persyaratan kontrak.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jika Anda perlu mengeskalasi masalah terkait kontrak, silakan gunakan
          tombol <strong>"Buka Sengketa"</strong> di halaman tiket atau unggahan kontrak.
          Kedua pihak akan memiliki waktu 24 jam untuk memberikan bukti sebelum
          admin meninjau kasus tersebut.
        </Typography>
      </Paper>
    </Box>
  );
}
