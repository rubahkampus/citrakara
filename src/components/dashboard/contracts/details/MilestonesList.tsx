// src/components/dashboard/contracts/MilestonesList.tsx
import React from "react";
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Paper,
  Divider,
} from "@mui/material";
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

const MilestonesList: React.FC<MilestonesListProps> = ({ milestones = [] }) => {
  // Format date helper
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "accepted":
        return { icon: <CheckCircleIcon fontSize="small" />, color: "success" };
      case "rejected":
        return { icon: <CancelIcon fontSize="small" />, color: "error" };
      case "inProgress":
        return { icon: <PlayArrowIcon fontSize="small" />, color: "primary" };
      default:
        return {
          icon: <HourglassEmptyIcon fontSize="small" />,
          color: "default",
        };
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Milestones
      </Typography>

      {milestones.map((milestone, index) => {
        const { icon, color } = getStatusConfig(milestone.status);

        return (
          <Box
            key={index}
            mb={2}
            sx={{
              borderRadius: 1,
              border: "1px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor:
                  milestone.status === "inProgress" ? "#f5f9ff" : "#fff",
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
                    label={milestone.status}
                    color={color as any}
                    icon={icon}
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography fontWeight="medium">
                  {milestone.percent}%
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={
                  milestone.status === "accepted"
                    ? 100
                    : milestone.status === "inProgress"
                    ? 50
                    : 0
                }
                sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
              />

              {milestone.status !== "pending" && (
                <Box mt={1}>
                  <Box display="flex" justifyContent="space-between">
                    {milestone.startedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Started: {formatDate(milestone.startedAt)}
                      </Typography>
                    )}

                    {milestone.completedAt && (
                      <Typography variant="body2" color="text.secondary">
                        Completed: {formatDate(milestone.completedAt)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            {index < milestones.length - 1 && <Divider />}
          </Box>
        );
      })}
    </Box>
  );
};

export default MilestonesList;
