// src/components/dashboard/contracts/MilestonesList.tsx
import React from "react";
import { Box, Typography, Chip } from "@mui/material";

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

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Milestones
      </Typography>

      {milestones.map((milestone, index) => (
        <Box
          key={index}
          mb={2}
          pb={2}
          borderBottom={
            index < milestones.length - 1 ? "1px solid #eee" : "none"
          }
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography>
              <Typography component="span" fontWeight="bold">
                {milestone.title}
              </Typography>
              {" - "}
              {milestone.percent}%
            </Typography>
            <Chip
              size="small"
              label={milestone.status}
              color={
                milestone.status === "accepted"
                  ? "success"
                  : milestone.status === "rejected"
                  ? "error"
                  : milestone.status === "inProgress"
                  ? "primary"
                  : "default"
              }
            />
          </Box>

          {milestone.status !== "pending" && (
            <Box mt={1}>
              {milestone.startedAt && (
                <Typography variant="body2">
                  Started: {formatDate(milestone.startedAt)}
                </Typography>
              )}

              {milestone.completedAt && (
                <Typography variant="body2">
                  Completed: {formatDate(milestone.completedAt)}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      ))}
    </>
  );
};

export default MilestonesList;
