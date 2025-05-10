// api/contract/create-from-proposal.ts
import { NextRequest, NextResponse } from "next/server";
import { createContractFromProposal } from "@/lib/services/contract.service";
import { getAuthSession, Session } from "@/lib/utils/session";
import { findProposalById } from "@/lib/db/repositories/proposal.repository";
import {
  checkSufficientFunds,
  addFundsToWallet,
} from "@/lib/services/wallet.service";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { proposalId, paymentMethod, paymentAmount } = await req.json();

    // Validate inputs
    if (!proposalId || !paymentMethod || !paymentAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the proposal
    const proposal = await findProposalById(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Verify the client is authorized to pay for this proposal
    if (proposal.clientId.toString() !== (session as Session).id) {
      return NextResponse.json(
        { error: "Not authorized to pay for this proposal" },
        { status: 403 }
      );
    }

    // Verify proposal is in accepted status
    if (proposal.status !== "accepted") {
      return NextResponse.json(
        { error: "Proposal must be in accepted status to create a contract" },
        { status: 400 }
      );
    }

    // Handle payment based on method
    if (paymentMethod === "wallet") {
      // Check if user has sufficient funds
      const hasFunds = await checkSufficientFunds(
        (session as Session).id,
        paymentAmount
      );
      if (!hasFunds) {
        return NextResponse.json(
          { error: "Insufficient funds in wallet" },
          { status: 400 }
        );
      }
    } else if (paymentMethod === "card") {
      // For card payments, we'd normally process the payment with a payment gateway
      // Here we'll simulate by adding funds to the wallet first, then proceeding
      await addFundsToWallet((session as Session).id, paymentAmount);
    }

    // Create the contract
    const contract = await createContractFromProposal(
      proposalId,
      paymentAmount
    );

    return NextResponse.json({
      success: true,
      message: "Contract created successfully",
      contractId: contract._id.toString(),
    });
  } catch (error: any) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create contract" },
      { status: 500 }
    );
  }
}
