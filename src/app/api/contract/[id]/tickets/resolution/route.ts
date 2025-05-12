// src/app/api/contracts/[contractId]/resolution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import {
  createResolutionTicket,
  getResolutionTicketsByContract,
} from "@/lib/services/ticket.service";
import { findContractById } from "@/lib/db/repositories/contract.repository";
import { handleError } from "@/lib/utils/errorHandler";

// GET: Fetch all resolution tickets for a contract
export async function GET(
  req: NextRequest,
  { params }: { params: { contractId: string } }
) {
    const param = await params
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the contract to verify user is part of it
    const contract = await findContractById(param.contractId);
    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Check if user is artist or client of the contract
    const isClient = contract.clientId.toString() === (session as Session).id;
    const isArtist = contract.artistId.toString() === (session as Session).id;

    if (!isClient && !isArtist) {
      return NextResponse.json(
        { error: "Not authorized to view resolutions for this contract" },
        { status: 403 }
      );
    }

    // Get the tickets
    const tickets = await getResolutionTicketsByContract(param.contractId);
    return NextResponse.json(tickets);
  } catch (error) {
    return handleError(error);
  }
}

// POST: Create a new resolution ticket for a contract
export async function POST(
  req: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const param = await params
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the contract to verify user is part of it
    const contract = await findContractById(param.contractId);
    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Check if user is artist or client of the contract
    const isClient = contract.clientId.toString() === (session as Session).id;
    const isArtist = contract.artistId.toString() === (session as Session).id;

    if (!isClient && !isArtist) {
      return NextResponse.json(
        { error: "Not authorized to create resolutions for this contract" },
        { status: 403 }
      );
    }

    // Check contract status - only allow resolution tickets on active contracts
    const allowedStatuses = ["active", "inRevision", "disputed"];
    if (!allowedStatuses.includes(contract.status)) {
      return NextResponse.json(
        {
          error:
            "Cannot create resolution tickets for contracts that are completed, canceled, or draft",
        },
        { status: 400 }
      );
    }

    // Process form data from the request
    const formData = await req.formData();

    // Create the resolution ticket
    const ticket = await createResolutionTicket(
      param.contractId,
      (session as Session).id,
      formData
    );

    return NextResponse.json(
      {
        message: "Resolution ticket created successfully",
        ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
