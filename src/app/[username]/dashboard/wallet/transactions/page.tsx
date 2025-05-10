// src/app/[username]/dashboard/wallet/transactions/page.tsx
import { Suspense } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { getTransactions } from "@/lib/services/wallet.service";
import DashboardLoadingSkeleton from "@/components/dashboard/DashboardLoadingSkeleton";

// This component would be created in src/components/dashboard/wallet/
// import TransactionsPage from "@/components/dashboard/wallet/TransactionsPage";

interface TransactionsPageProps {
  params: { username: string };
}

export default async function WalletTransactionsPage({
  params,
}: TransactionsPageProps) {
  const { username } = params;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  let transactions;
  try {
    transactions = await getTransactions((session as Session).id);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return <Alert severity="error">Failed to load transaction data</Alert>;
  }

  const serializedTransactions = JSON.parse(JSON.stringify(transactions));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Transaction History
      </Typography>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        {/* This component would be implemented separately */}
        {/* <TransactionsPage
          username={username}
          transactions={serializedTransactions}
        /> */}
        <Box>
          <Typography variant="h6">Recent Transactions</Typography>
          {transactions.length === 0 ? (
            <Typography>No transactions found</Typography>
          ) : (
            <Typography>Found {transactions.length} transactions</Typography>
          )}
        </Box>
      </Suspense>
    </Box>
  );
}
