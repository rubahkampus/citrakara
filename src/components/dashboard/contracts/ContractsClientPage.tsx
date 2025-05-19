"use client";

import React, { Suspense } from "react";
import {
  Box,
  Typography,
  Alert,
  Container,
  Paper,
  CircularProgress,
} from "@mui/material";
import ContractListingPage from "@/components/dashboard/contracts/ContractListingPage";
import ContractListingSkeleton from "@/components/dashboard/contracts/ContractListingSkeleton";
import { IContract } from "@/lib/db/models/contract.model";

interface ContractsClientPageProps {
  username: string;
  asArtist: IContract[];
  asClient: IContract[]; 
  error?: string;
  isAuthorized: boolean;
}

export default function ContractsClientPage({
  username,
  asArtist,
  asClient,
  error,
  isAuthorized,
}: ContractsClientPageProps) {
  if (!isAuthorized) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        >
          You do not have access to this page. Please log in with the correct
          account.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Use key to force re-render when data changes */}
      <ContractListingPage
        key={`contract-list-${asArtist?.length}-${asClient?.length}`}
        username={username}
        asArtist={asArtist || []}
        asClient={asClient || []}
        error={error}
      />
    </Container>
  );
}
