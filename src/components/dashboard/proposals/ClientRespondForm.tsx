// // src/components/dashboard/proposals/ClientRespondForm.tsx
// /**
//  * ClientRespondForm
//  * ------------------
//  * Renders UI for client to accept or reject artist adjustments.
//  *
//  * Props:
//  *   - proposal: ProposalUI
//  *   - onSubmit: (decision: { accept: boolean; rejectionReason?: string }) => void
//  *   - loading?: boolean
//  *
//  * UI Elements:
//  *   - Display updated price breakdown
//  *   - Text input for rejectionReason (if rejecting)
//  *   - Buttons: Accept & Pay, Reject
//  */
// import React, { useState } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Stack,
//   Table,
//   TableBody,
//   TableCell,
//   TableRow,
//   Divider,
//   TextField,
//   Paper,
//   Alert,
// } from "@mui/material";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import CancelIcon from "@mui/icons-material/Cancel";
// import { IProposal } from "@/lib/db/models/proposal.model";
// interface ClientRespondFormProps {
//   proposal: IProposal;
//   loading?: boolean;
//   onSubmit: (decision: { accept: boolean; rejectionReason?: string }) => void;
// }

// export default function ClientRespondForm({
//   proposal,
//   onSubmit,
//   loading = false,
// }: ClientRespondFormProps) {
//   const [rejectionReason, setRejectionReason] = useState("");
//   const [isRejecting, setIsRejecting] = useState(false);

//   const handleAccept = () => {
//     onSubmit({
//       accept: true,
//     });
//   };

//   const handleRejectClick = () => {
//     setIsRejecting(true);
//   };

//   const handleConfirmReject = () => {
//     onSubmit({
//       accept: false,
//       rejectionReason:
//         rejectionReason || "Client declined the adjusted proposal",
//     });
//   };

//   const adjustments = proposal.adjustments;
//   const hasAdjustments = adjustments?.surcharge || adjustments?.discount;

//   return (
//     <Box sx={{ maxWidth: 800, mx: "auto" }}>
//       {/* Artist Adjustment Notice */}
//       {hasAdjustments && (
//         <Alert severity="info" sx={{ mb: 3 }}>
//           The artist has adjusted the proposal price. Please review the changes
//           below.
//         </Alert>
//       )}

//       {/* Price Breakdown */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent>
//           <Typography variant="h6" gutterBottom>
//             Price Breakdown
//           </Typography>

//           <Table>
//             <TableBody>
//               <TableRow>
//                 <TableCell>Base Price</TableCell>
//                 <TableCell align="right">
//                   IDR {proposal.priceBreakdown.basePrice.toLocaleString()}
//                 </TableCell>
//               </TableRow>
//               <TableRow>
//                 <TableCell>Selected Options</TableCell>
//                 <TableCell align="right">
//                   IDR {proposal.priceBreakdown.optionsTotal.toLocaleString()}
//                 </TableCell>
//               </TableRow>
//               {proposal.priceBreakdown.rush > 0 && (
//                 <TableRow>
//                   <TableCell>Rush Fee</TableCell>
//                   <TableCell align="right">
//                     IDR {proposal.priceBreakdown.rush.toLocaleString()}
//                   </TableCell>
//                 </TableRow>
//               )}
//               {hasAdjustments && (
//                 <>
//                   <TableRow>
//                     <TableCell colSpan={2}>
//                       <Divider />
//                     </TableCell>
//                   </TableRow>
//                   {adjustments?.surcharge && (
//                     <TableRow>
//                       <TableCell>
//                         Artist Surcharge
//                         {adjustments.surcharge.reason && (
//                           <Typography variant="body2" color="text.secondary">
//                             {adjustments.surcharge.reason}
//                           </Typography>
//                         )}
//                       </TableCell>
//                       <TableCell align="right" sx={{ color: "error.main" }}>
//                         +IDR {adjustments.surcharge.amount.toLocaleString()}
//                       </TableCell>
//                     </TableRow>
//                   )}
//                   {adjustments?.discount && (
//                     <TableRow>
//                       <TableCell>
//                         Artist Discount
//                         {adjustments.discount.reason && (
//                           <Typography variant="body2" color="text.secondary">
//                             {adjustments.discount.reason}
//                           </Typography>
//                         )}
//                       </TableCell>
//                       <TableCell align="right" sx={{ color: "success.main" }}>
//                         -IDR {adjustments.discount.amount.toLocaleString()}
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </>
//               )}
//               <TableRow>
//                 <TableCell sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
//                 <TableCell
//                   align="right"
//                   sx={{ fontWeight: "bold", fontSize: "1.2rem" }}
//                 >
//                   IDR {proposal.priceBreakdown.finalTotal.toLocaleString()}
//                 </TableCell>
//               </TableRow>
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Project Details Summary */}
//       <Card sx={{ mb: 3 }}>
//         <CardContent>
//           <Typography variant="subtitle1" gutterBottom>
//             Project: {proposal.listingTitle}
//           </Typography>
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//             Deadline: {new Date(proposal.deadline).toLocaleDateString()}
//           </Typography>

//           <Paper
//             sx={{ backgroundColor: "action.hover", p: 2, borderRadius: 1 }}
//           >
//             <Typography variant="body2">
//               {proposal.generalDescription}
//             </Typography>
//           </Paper>
//         </CardContent>
//       </Card>

//       {/* Actions */}
//       {!isRejecting ? (
//         <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
//           <Button
//             variant="outlined"
//             color="error"
//             size="large"
//             startIcon={<CancelIcon />}
//             onClick={handleRejectClick}
//             disabled={loading}
//             sx={{ minWidth: 200 }}
//           >
//             Reject Proposal
//           </Button>
//           <Button
//             variant="contained"
//             color="primary"
//             size="large"
//             startIcon={<CheckCircleIcon />}
//             onClick={handleAccept}
//             disabled={loading}
//             sx={{ minWidth: 200 }}
//           >
//             Accept & Pay
//           </Button>
//         </Stack>
//       ) : (
//         <Card>
//           <CardContent>
//             <Typography variant="h6" gutterBottom>
//               Reject Proposal
//             </Typography>
//             <TextField
//               label="Reason for rejection"
//               multiline
//               rows={4}
//               fullWidth
//               value={rejectionReason}
//               onChange={(e) => setRejectionReason(e.target.value)}
//               placeholder="Please provide a reason for rejecting this proposal"
//               sx={{ mb: 3 }}
//             />
//             <Stack
//               direction="row"
//               spacing={2}
//               sx={{ justifyContent: "center" }}
//             >
//               <Button
//                 variant="outlined"
//                 onClick={() => setIsRejecting(false)}
//                 disabled={loading}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 variant="contained"
//                 color="error"
//                 onClick={handleConfirmReject}
//                 disabled={loading}
//               >
//                 Confirm Rejection
//               </Button>
//             </Stack>
//           </CardContent>
//         </Card>
//       )}
//     </Box>
//   );
// }
