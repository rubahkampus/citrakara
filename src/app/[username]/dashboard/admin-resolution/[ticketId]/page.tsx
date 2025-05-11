// src/app/[username]/dashboard/admin-resolution/[ticketId]/page.tsx
import { Box, Alert, Typography, Divider, Paper, Button } from "@mui/material";
import { getAuthSession, isUserOwner, Session } from "@/lib/utils/session";
import { isUserAdminById } from "@/lib/services/user.service";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { getContractById } from "@/lib/services/contract.service";

// This component would be created in src/components/dashboard/admin/
// import AdminResolutionForm from "@/components/dashboard/admin/AdminResolutionForm";

interface AdminResolutionDetailPageProps {
  params: {
    username: string;
    ticketId: string;
  };
}

export default async function AdminResolutionDetailPage({
  params,
}: AdminResolutionDetailPageProps) {
  const { username, ticketId } = params;
  const session = await getAuthSession();

  if (!session || !isUserOwner(session as Session, username)) {
    return <Alert severity="error">You do not have access to this page</Alert>;
  }

  // Check if user is an admin
  const isAdmin = await isUserAdminById((session as Session).id);
  if (!isAdmin) {
    return <Alert severity="error">You do not have admin privileges</Alert>;
  }

  let ticket;
  try {
    ticket = await findResolutionTicketById(ticketId);
    if (!ticket) {
      return <Alert severity="error">Resolution ticket not found</Alert>;
    }
  } catch (err) {
    console.error("Error fetching resolution ticket:", err);
    return <Alert severity="error">Failed to load resolution ticket</Alert>;
  }

  // Get the related contract for context
  let contract;
  try {
    contract = await getContractById(
      ticket.contractId,
      (session as Session).id
    );
  } catch (err) {
    console.error("Error fetching contract:", err);
    return <Alert severity="error">Failed to load contract data</Alert>;
  }

  // Check if ticket is ready for admin resolution
  const canResolve = ticket.status === "awaitingReview";

  // Serialize for client components
  const serializedTicket = JSON.parse(JSON.stringify(ticket));
  const serializedContract = JSON.parse(JSON.stringify(contract));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Resolution Ticket #{ticketId}
      </Typography>

      {!canResolve && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {ticket.status === "open"
            ? "This ticket is still open for counterproof submission. You can review it, but you cannot make a decision yet."
            : ticket.status === "resolved"
            ? "This ticket has already been resolved."
            : "This ticket cannot be resolved at this time."}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Ticket Overview
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography variant="subtitle2">Status</Typography>
            <Typography>{ticket.status}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Submitted By</Typography>
            <Typography>{ticket.submittedBy}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Created</Typography>
            <Typography>
              {new Date(ticket.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Target Type</Typography>
            <Typography>{ticket.targetType}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Contract ID</Typography>
            <Typography>{ticket.contractId.toString()}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Target ID</Typography>
            <Typography>{ticket.targetId.toString()}</Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {ticket.submittedBy.charAt(0).toUpperCase() +
              ticket.submittedBy.slice(1)}
            's Claim
          </Typography>
          <Typography paragraph>{ticket.description}</Typography>

          {ticket.proofImages && ticket.proofImages.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Proof Images ({ticket.proofImages.length})
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {ticket.proofImages.map((img, i) => (
                  <Box
                    key={i}
                    component="img"
                    src={img}
                    sx={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        <Paper elevation={2} sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>
            {ticket.counterparty.charAt(0).toUpperCase() +
              ticket.counterparty.slice(1)}
            's Response
          </Typography>

          {ticket.counterDescription ? (
            <>
              <Typography paragraph>{ticket.counterDescription}</Typography>

              {ticket.counterProofImages &&
                ticket.counterProofImages.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Counterproof Images ({ticket.counterProofImages.length})
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {ticket.counterProofImages.map((img, i) => (
                        <Box
                          key={i}
                          component="img"
                          src={img}
                          sx={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
            </>
          ) : (
            <Box>
              <Typography>No counterproof submitted yet.</Typography>
              {ticket.status === "open" && (
                <Typography sx={{ mt: 1 }}>
                  Counterparty has until{" "}
                  {new Date(ticket.counterExpiresAt).toLocaleString()} to
                  respond.
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {ticket.status === "resolved" ? (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Resolution Decision
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2">Decision</Typography>
              <Typography>
                {ticket.decision === "favorClient"
                  ? "In Favor of Client"
                  : "In Favor of Artist"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Resolved By</Typography>
              <Typography>{ticket.resolvedBy?.toString()}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Resolved On</Typography>
              <Typography>
                {new Date(ticket.resolvedAt!).toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Resolution Note</Typography>
            <Typography>{ticket.resolutionNote}</Typography>
          </Box>
        </Paper>
      ) : canResolve ? (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Make Resolution Decision
          </Typography>

          {/* This component would be implemented separately */}
          {/* <AdminResolutionForm
            ticket={serializedTicket}
            contract={serializedContract}
            userId={session.id}
          /> */}

          <Box>
            <Typography sx={{ mb: 2 }}>
              As an administrator, you need to decide which party's position to
              uphold. Consider all evidence provided by both parties before
              making your decision.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle2">Decision</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button variant="outlined" color="primary">
                  Favor Client
                </Button>
                <Button variant="outlined" color="primary">
                  Favor Artist
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>
                Resolution Note
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Provide a detailed explanation of your decision. This will be
                visible to both parties.
              </Typography>
              <Box
                component="textarea"
                placeholder="Enter your reasoning here..."
                sx={{
                  width: "100%",
                  minHeight: "120px",
                  p: 1,
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
              />

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!canResolve}
                >
                  Submit Resolution
                </Button>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mt: 3 }}>
              This action cannot be undone. Once you submit a decision, it will
              be immediately applied to the contract.
            </Alert>
          </Box>
        </Paper>
      ) : null}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Contract Information
        </Typography>
        <Box
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}
        >
          <Box>
            <Typography variant="subtitle2">Contract Status</Typography>
            <Typography>{contract.status}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Artist</Typography>
            <Typography>{contract.artistId.toString()}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Client</Typography>
            <Typography>{contract.clientId.toString()}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Created</Typography>
            <Typography>
              {new Date(contract.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Deadline</Typography>
            <Typography>
              {new Date(contract.deadlineAt).toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Grace Period Ends</Typography>
            <Typography>
              {new Date(contract.graceEndsAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
