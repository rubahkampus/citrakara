// src/app/api/admin/contracts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { rotateToken } from "@/lib/api/rotateToken";
import { handleError } from "@/lib/utils/errorHandler";
import { findContractsByUser } from "@/lib/db/repositories/contract.repository";
import { IContract } from "@/lib/db/models/contract.model";
import { isUserAdminByUsername } from "@/lib/services/user.service";

// Get all contracts (admin only)
export async function GET(req: NextRequest) {
  try {
    return withAuth(async (session) => {
      // Check if user is admin (to be implemented)
      const isAdmin = await isUserAdminByUsername(session.username); 
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Access denied. Admin privileges required." },
          { status: 403 }
        );
      }

      // Extract query parameters
      const url = new URL(req.url);
      const status = url.searchParams.get("status")?.split(",");
      const clientId = url.searchParams.get("clientId");
      const artistId = url.searchParams.get("artistId");

      // Build options
      const options: any = { status };

      // Determine which contracts to fetch
      let contracts: IContract[] = [];
      if (clientId) {
        contracts = await findContractsByUser(clientId, "client", options);
      } else if (artistId) {
        contracts = await findContractsByUser(artistId, "artist", options);
      } else {
        // Fetch all contracts - this might need to be paginated in a real implementation
        contracts = []; // Placeholder - requires a special repo method
      }

      const response = NextResponse.json(contracts);
      rotateToken(response, session);
      return response;
    });
  } catch (error) {
    return handleError(error);
  }
}
