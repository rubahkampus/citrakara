import React from "react";
import { Box, Typography, Chip, LinearProgress, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";

interface Milestone {
  title: string;
  percent: number;
  status: string;
  startedAt?: string | Date;
  completedAt?: string | Date;
}

interface MilestonesListProps {
  milestones?: Milestone[];
}

interface StatusConfig {
  icon: React.ReactElement;
  color: "success" | "error" | "primary" | "default";
  label: string;
  progressValue: number;
}

/**
 * Component to display a list of project milestones with their status
 */
const MilestonesList: React.FC<MilestonesListProps> = ({ milestones = [] }) => {
  // Format date helper
  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString();
  };

  // Get status configuration (icon, color, label, progress)
  const getStatusConfig = (status: string): StatusConfig => {
    switch (status) {
      case "accepted":
        return {
          icon: <CheckCircleIcon fontSize="small" />,
          color: "success",
          label: "Diterima",
          progressValue: 100,
        };
      case "rejected":
        return {
          icon: <CancelIcon fontSize="small" />,
          color: "error",
          label: "Ditolak",
          progressValue: 0,
        };
      case "inProgress":
        return {
          icon: <PlayArrowIcon fontSize="small" />,
          color: "primary",
          label: "Sedang Dikerjakan",
          progressValue: 50,
        };
      default:
        return {
          icon: <HourglassEmptyIcon fontSize="small" />,
          color: "default",
          label: "Menunggu",
          progressValue: 0,
        };
    }
  };

  // Common styles
  const milestoneBoxStyle = {
    borderRadius: 1,
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    mb: 2,
  };

  const progressBarStyle = {
    mt: 1,
    mb: 1,
    height: 6,
    borderRadius: 3,
  };

  // Render milestone dates
  const renderMilestoneDates = (milestone: Milestone) => {
    if (milestone.status === "pending") return null;

    return (
      <Box mt={1}>
        <Box display="flex" justifyContent="space-between">
          {milestone.startedAt && (
            <Typography variant="body2" color="text.secondary">
              Dimulai: {formatDate(milestone.startedAt)}
            </Typography>
          )}

          {milestone.completedAt && (
            <Typography variant="body2" color="text.secondary">
              Selesai: {formatDate(milestone.completedAt)}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Render single milestone
  const renderMilestone = (milestone: Milestone, index: number) => {
    const { icon, color, label, progressValue } = getStatusConfig(
      milestone.status
    );
    const isInProgress = milestone.status === "inProgress";

    return (
      <Box key={`milestone-${index}`} sx={milestoneBoxStyle}>
        <Box
          sx={{
            p: 2,
            backgroundColor: isInProgress ? "#f5f9ff" : "#fff",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center">
              <Typography fontWeight="bold" mr={1}>
                {milestone.title}
              </Typography>
              <Chip
                size="small"
                label={label}
                color={color}
                icon={icon}
                sx={{ ml: 1 }}
              />
            </Box>
            <Typography fontWeight="medium">{milestone.percent}%</Typography>
          </Box>

          {/* <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={progressBarStyle}
          /> */}

          {renderMilestoneDates(milestone)}
        </Box>

        {index < milestones.length - 1 && <Divider />}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Daftar Milestone
      </Typography>

      {milestones.map(renderMilestone)}
    </Box>
  );
};

export default MilestonesList;
