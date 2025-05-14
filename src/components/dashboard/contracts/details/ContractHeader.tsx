// src/components/dashboard/contracts/ContractHeader.tsx
import React from "react";
import {
  Box,
  Typography,
  Divider,
  Breadcrumbs,
  Link,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ArticleIcon from "@mui/icons-material/Article";
import { IContract } from "@/lib/db/models/contract.model";
import ContractStatusBadge from "../ContractStatusBadge";
import { NavigateNext, Home, LocalAtm, ArrowBack } from "@mui/icons-material";

interface ContractHeaderProps {
  contract: IContract;
  username: string;
}

const ContractHeader: React.FC<ContractHeaderProps> = ({
  contract,
  username,
}) => {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          <Link
            component={Link}
            href={`/${username}/dashboard`}
            underline="hover"
            color="inherit"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Home fontSize="small" sx={{ mr: 0.5 }} />
            Dashboard
          </Link>
          <Link
            component={Link}
            href={`/${username}/dashboard/contracts`}
            underline="hover"
            color="inherit"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <LocalAtm fontSize="small" sx={{ mr: 0.5 }} />
            Kontrak
          </Link>
          <Typography
            color="text.primary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            Detail Kontrak
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Typography variant="h5" fontWeight="500">
            Detail Kontrak
          </Typography>
          <Button
            component={Link}
            href={`/${username}/dashboard/wallet`}
            variant="outlined"
            startIcon={<ArrowBack />}
            size="small"
          >
            Kembali ke Kontrak
          </Button>
        </Box>
      </Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight="medium">
            {contract.proposalSnapshot.listingSnapshot.title ||
              "Contract Details"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {contract._id.toString().substring(0, 8)}...
          </Typography>
        </Box>
        <ContractStatusBadge status={contract.status} />
      </Box>

      <Divider sx={{ mb: 3 }} />
    </>
  );
};

export default ContractHeader;
