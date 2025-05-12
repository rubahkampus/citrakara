// src/components/dashboard/contracts/tabs/ContractTermsTab.tsx
import React from "react";
import { Box, Typography, Grid, Link as MuiLink } from "@mui/material";
import { IContract } from "@/lib/db/models/contract.model";

interface ContractTermsTabProps {
  contract: IContract;
}

const ContractTermsTab: React.FC<ContractTermsTabProps> = ({ contract }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Contract Terms
      </Typography>
      <Typography fontWeight="bold" gutterBottom>
        Description
      </Typography>
      <Typography gutterBottom>
        {
          contract.contractTerms[contract.contractTerms.length - 1]
            .generalDescription
        }
      </Typography>

      {contract.contractTerms[contract.contractTerms.length - 1].referenceImages
        ?.length > 0 && (
        <Box mt={2}>
          <Typography fontWeight="bold" gutterBottom>
            Reference Images
          </Typography>
          <Grid container spacing={1}>
            {contract.contractTerms[
              contract.contractTerms.length - 1
            ].referenceImages.map((image, index) => (
              <Grid item key={index} xs={6} sm={4} md={3}>
                <Box
                  component="img"
                  src={image}
                  alt={`Reference ${index + 1}`}
                  sx={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 1,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {contract.contractVersion > 1 && (
        <Box mt={3}>
          <Typography>
            This contract has been amended {contract.contractVersion - 1} times.
            <MuiLink
              component="button"
              onClick={() => alert("Contract history would show here")}
            >
              View history
            </MuiLink>
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ContractTermsTab;
