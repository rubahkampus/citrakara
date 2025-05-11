// src/app/api/resolution/[ticketId]/counterproof/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, Session } from "@/lib/utils/session";
import { findResolutionTicketById } from "@/lib/db/repositories/ticket.repository";
import { submitCounterproof } from "@/lib/services/ticket.service";
import { handleError } from "@/lib/utils/errorHandler";
import { findContractById } from "@/lib/db/repositories/contract.repository";

// POST: Submit counterproof for a resolution ticket
export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the ticket to validate permissions
    const ticket = await findResolutionTicketById(params.ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get contract related to ticket
    const contract = await findContractById(ticket.contractId);
    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Check if user is the counterparty
    const isCounterparty =
      (ticket.submittedBy === "client" &&
        ticket.counterparty === "artist" &&
        contract.artistId.toString() === (session as Session).id) ||
      (ticket.submittedBy === "artist" &&
        ticket.counterparty === "client" &&
        contract.clientId.toString() === (session as Session).id);

    if (!isCounterparty) {
      return NextResponse.json(
        { error: "Only the counterparty can submit counterproof" },
        { status: 403 }
      );
    }

    // Check if ticket is still open for counterproof
    if (ticket.status !== "open") {
      return NextResponse.json(
        { error: "This resolution is no longer accepting counterproof" },
        { status: 400 }
      );
    }

    // Check if deadline has passed
    if (new Date(ticket.counterExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "The deadline for submitting counterproof has passed" },
        { status: 400 }
      );
    }

    // Check if counterproof already submitted
    if (ticket.counterDescription) {
      return NextResponse.json(
        { error: "You have already submitted counterproof" },
        { status: 400 }
      );
    }

    // Process the form data
    const formData = await req.formData();
    const counterDescription = formData.get("counterDescription")?.toString();

    if (!counterDescription) {
      return NextResponse.json(
        { error: "Counterproof description is required" },
        { status: 400 }
      );
    }

    // Extract proof image files
    const counterProofImageBlobs = formData
      .getAll("counterProofImages[]")
      .filter((v) => v instanceof Blob) as Blob[];

    // Submit counterproof
    const updatedTicket = await submitCounterproof(
      params.ticketId,
      (session as Session).id,
      formData
    );

    return NextResponse.json({
      message: "Counterproof submitted successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    return handleError(error);
  }
}
