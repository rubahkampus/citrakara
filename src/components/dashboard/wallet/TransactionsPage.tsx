// components/dashboard/wallet/TransactionsPage.tsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Grid,
  Stack,
  Tooltip,
  IconButton,
  SelectChangeEvent,
} from "@mui/material";
import {
  Search,
  FilterList,
  NorthEast,
  SouthWest,
  Circle,
  Info,
} from "@mui/icons-material";

// Types
interface Transaction {
  _id: string;
  type: "hold" | "release" | "refund" | "revision_fee" | "change_fee";
  from: "client" | "escrow";
  to: "escrow" | "artist" | "client";
  amount: number;
  note?: string;
  createdAt: string;
  contractId?: string;
}

interface TransactionsPageProps {
  username: string;
  transactions: Transaction[];
}

// Main component
const TransactionsPage: React.FC<TransactionsPageProps> = ({
  username,
  transactions,
}) => {
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string): string => {
    switch (type) {
      case "hold":
        return "Payment Hold";
      case "release":
        return "Payment Release";
      case "refund":
        return "Refund";
      case "revision_fee":
        return "Revision Fee";
      case "change_fee":
        return "Change Fee";
      default:
        return type;
    }
  };

  // Get transaction color
  const getTransactionColor = (type: string, to: string): string => {
    if (to === "client" && type === "refund") return "success";
    if (to === "artist" && type === "release") return "success";
    if (type === "hold" || type === "revision_fee" || type === "change_fee")
      return "warning";
    return "default";
  };

  // Get transaction direction icon
  const getTransactionIcon = (type: string, from: string, to: string) => {
    if (from === "client") {
      return <SouthWest fontSize="small" />;
    } else if (to === "client") {
      return <NorthEast fontSize="small" />;
    } else {
      return <Circle fontSize="small" />;
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        !searchTerm ||
        transaction.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.contractId
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getTransactionTypeLabel(transaction.type)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, typeFilter]);

  // Handle pagination changes
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleTypeFilterChange = (event: SelectChangeEvent<string>) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search transactions"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              placeholder="Search by contract ID, note, or type"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="type-filter-label">Transaction Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Transaction Type"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="hold">Payment Hold</MenuItem>
                <MenuItem value="release">Payment Release</MenuItem>
                <MenuItem value="refund">Refund</MenuItem>
                <MenuItem value="revision_fee">Revision Fee</MenuItem>
                <MenuItem value="change_fee">Change Fee</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid
            item
            xs={12}
            md={2}
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
          >
            <Typography>
              {filteredTransactions.length} transaction(s)
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="transactions table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Flow</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Contract</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography sx={{ py: 2 }}>No transactions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction) => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTransactionTypeLabel(transaction.type)}
                        color={
                          getTransactionColor(
                            transaction.type,
                            transaction.to
                          ) as
                            | "default"
                            | "primary"
                            | "secondary"
                            | "error"
                            | "info"
                            | "success"
                            | "warning"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">
                          {transaction.from} → {transaction.to}
                        </Typography>
                        {getTransactionIcon(
                          transaction.type,
                          transaction.from,
                          transaction.to
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight="bold"
                        color={
                          transaction.to === "artist"
                            ? "success.main"
                            : transaction.to === "client"
                            ? "success.main"
                            : "text.primary"
                        }
                      >
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {transaction.contractId ? (
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 150,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {transaction.contractId.substring(0, 8)}...
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {transaction.note || "-"}
                        </Typography>
                        {transaction.note && (
                          <Tooltip title={transaction.note}>
                            <IconButton size="small">
                              <Info fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default TransactionsPage;
