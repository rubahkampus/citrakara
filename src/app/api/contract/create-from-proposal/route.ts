// src/app/api/contract/create-from-proposal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createContractFromProposal } from "@/lib/services/contract.service";
import { getAuthSession, Session } from "@/lib/utils/session";
import { findProposalById } from "@/lib/db/repositories/proposal.repository";
import {
  checkSufficientFunds,
  addFundsToWallet,
} from "@/lib/services/wallet.service";
import { handleError } from "@/lib/utils/errorHandler";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const {
      proposalId,
      paymentMethod,
      secondaryMethod,
      walletAmount,
      remainingAmount,
      paymentAmount,
    } = await req.json();

    console.log({
      proposalId,
      paymentMethod,
      secondaryMethod,
      walletAmount,
      remainingAmount,
      paymentAmount,
    });

    // Validate required inputs - check for undefined/null, not just falsy values
    if (
      proposalId === undefined ||
      paymentMethod === undefined ||
      paymentAmount === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate combination payment - properly check for undefined values
    if (
      paymentMethod === "combo" &&
      (secondaryMethod === undefined ||
        walletAmount === undefined ||
        remainingAmount === undefined)
    ) {
      return NextResponse.json(
        {
          error:
            "Combo payment requires secondaryMethod, walletAmount, and remainingAmount",
        },
        { status: 400 }
      );
    }

    // Verify total adds up for combo payments
    if (
      paymentMethod === "combo" &&
      Number(walletAmount) + Number(remainingAmount) !== Number(paymentAmount)
    ) {
      return NextResponse.json(
        { error: "Payment amounts do not match total" },
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
    switch (paymentMethod) {
      case "wallet":
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
        break;

      case "card":
        // For card payments, we'd normally process the payment with a payment gateway
        // Here we'll simulate by adding funds to the wallet first, then proceeding
        await addFundsToWallet((session as Session).id, paymentAmount);
        break;

      case "combo":
        // Check if user has sufficient funds for wallet portion
        const hasPartialFunds = await checkSufficientFunds(
          (session as Session).id,
          walletAmount
        );
        if (!hasPartialFunds) {
          return NextResponse.json(
            { error: "Insufficient funds in wallet for partial payment" },
            { status: 400 }
          );
        }

        // Process secondary payment method for remaining amount
        if (secondaryMethod === "card") {
          // Simulate card payment by adding the remaining amount to wallet
          await addFundsToWallet((session as Session).id, remainingAmount);
        } else {
          return NextResponse.json(
            { error: "Unsupported secondary payment method" },
            { status: 400 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported payment method" },
          { status: 400 }
        );
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
  } catch (error) {
    return handleError(error);
  }
}
