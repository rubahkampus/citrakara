// src/components/dashboard/proposals/ProposalListingSkeleton.tsx
"use client";

import React from "react";
import { Box, Grid, Skeleton, Card, CardContent, Stack } from "@mui/material";

export default function ProposalListingSkeleton() {
  const skeletonItems = [1, 2, 3, 4];

  return (
    <Grid container spacing={3}>
      {skeletonItems.map((i) => (
        <Grid item xs={12} sm={6} lg={4} key={i}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                {/* Header with title and status */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="rounded" width={80} height={24} />
                </Box>

                {/* Dates section */}
                <Box>
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={20}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width="90%" height={20} />
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={20}
                    sx={{ mt: 1 }}
                  />
                </Box>

                {/* Divider */}
                <Skeleton variant="rectangular" height={1} />

                {/* Price breakdown */}
                <Box>
                  <Skeleton
                    variant="text"
                    width="35%"
                    height={20}
                    sx={{ mb: 1 }}
                  />
                  <Stack spacing={1}>
                    {[1, 2, 3, 4].map((j) => (
                      <Box
                        key={j}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Skeleton variant="text" width="40%" height={20} />
                        <Skeleton variant="text" width="30%" height={20} />
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Skeleton variant="rectangular" height={36} width="48%" />
                  <Skeleton variant="rectangular" height={36} width="48%" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
