// src/components/dashboard/commissions/CommissionListingSkeleton.tsx
import { Box, Grid, Skeleton } from "@mui/material";

export default function CommissionListingSkeleton() {
  return (
    <Box>
      {/* Action button skeleton */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Skeleton width={200} height={40} />
      </Box>

      {/* Commission listing grid skeleton */}
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Grid item xs={12} sm={6} lg={4} key={item}>
            <Box sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Skeleton variant="rectangular" height={180} />
              <Box sx={{ p: 2 }}>
                <Skeleton width="70%" height={32} sx={{ mb: 1 }} />
                <Skeleton width="40%" height={24} sx={{ mb: 1 }} />
                <Skeleton width="60%" height={32} sx={{ mb: 1 }} />
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Skeleton width={60} height={24} />
                  <Skeleton width={60} height={24} />
                  <Skeleton width={60} height={24} />
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  p: 2,
                  pt: 0,
                }}
              >
                <Skeleton width={60} height={32} />
                <Skeleton width={100} height={32} />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
