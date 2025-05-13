"use client";

import React from "react";
import {
  Box,
  Skeleton,
  Paper,
  List,
  ListItem,
  Stack,
  Divider,
  Typography,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";

const ContractListingSkeleton: React.FC = () => {
  const theme = useTheme();
  const skeletonItems = [1, 2, 3, 4];

  return (
    <Box>
      {/* Header and filters skeleton */}
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Skeleton variant="text" width={180} height={32} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Skeleton variant="rounded" width={120} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Stack>
      </Box>

      {/* Tabs skeleton */}
      <Paper
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          mb: 3,
          boxShadow: theme.shadows[1],
        }}
      >
        <Tabs value={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
          {["All", "Active", "Completed", "Cancelled"].map((_, index) => (
            <Tab key={index} label={<Skeleton width={80} height={24} />} />
          ))}
        </Tabs>
      </Paper>

      {/* Contract list skeleton */}
      <List sx={{ width: "100%", p: 0 }}>
        {skeletonItems.map((item) => (
          <Paper
            key={item}
            sx={{
              mb: 2,
              overflow: "hidden",
              borderRadius: 1,
              boxShadow: theme.shadows[1],
            }}
          >
            {/* Status header skeleton */}
            <Box
              sx={{
                p: 2,
                borderLeft: 6,
                borderColor: "grey.300",
                backgroundColor: "grey.100",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Box>

            {/* Main content skeleton */}
            <ListItem sx={{ display: "block", p: 2 }}>
              <Skeleton variant="text" width="70%" height={32} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ mt: 2, mb: 2 }}
                divider={<Divider orientation="vertical" flexItem />}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    sx={{ mr: 1 }}
                  />
                  <Skeleton variant="text" width={100} height={24} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    sx={{ mr: 1 }}
                  />
                  <Skeleton variant="text" width={120} height={24} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    sx={{ mr: 1 }}
                  />
                  <Skeleton variant="text" width={140} height={24} />
                </Box>
              </Stack>

              {/* Milestone progress skeleton */}
              {item % 2 === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="text" width={150} height={24} />
                  <Skeleton
                    variant="rounded"
                    height={8}
                    width="100%"
                    sx={{ borderRadius: 5, mt: 0.5 }}
                  />
                </Box>
              )}

              {/* Action button skeleton */}
              <Box sx={{ mt: 3, textAlign: "right" }}>
                <Skeleton
                  variant="rounded"
                  width={120}
                  height={36}
                  sx={{ borderRadius: 2, display: "inline-block" }}
                />
              </Box>
            </ListItem>
          </Paper>
        ))}
      </List>
    </Box>
  );
};

export default ContractListingSkeleton;
