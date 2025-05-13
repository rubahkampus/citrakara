"use client";

import React from "react";
import {
  Box,
  Skeleton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  useTheme,
} from "@mui/material";

const ResolutionListSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
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
          {[0, 1, 2, 3, 4, 5].map((tab) => (
            <Tab
              key={tab}
              label={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Skeleton
                    variant="circular"
                    width={18}
                    height={18}
                    sx={{ mr: 0.5 }}
                  />
                  <Skeleton variant="text" width={70} height={20} />
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    sx={{ ml: 0.5 }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Table skeleton */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 1,
          boxShadow: theme.shadows[1],
          overflow: "hidden",
          mb: 4,
        }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: theme.palette.background.default }}>
            <TableRow>
              <TableCell>
                <Skeleton variant="text" width={80} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={70} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={120} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={90} />
              </TableCell>
              <TableCell align="center">
                <Skeleton variant="text" width={60} />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[0, 1, 2, 3, 4].map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <Skeleton variant="text" width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="text" width={100} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width={70} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width={60} height={24} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rounded" width={120} height={24} />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rounded"
                    width={90}
                    height={30}
                    sx={{ mx: "auto" }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info box skeleton */}
      <Paper sx={{ p: 2, borderRadius: 1, mt: 4 }}>
        <Skeleton variant="text" width="30%" height={28} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
      </Paper>
    </Box>
  );
};

export default ResolutionListSkeleton;
