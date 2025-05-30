// Create this file: src/components/ExpirationProcessor.tsx
"use client";

import { useEffect, useRef } from "react";
import { axiosClient } from "@/lib/utils/axiosClient";

interface ExpirationProcessorProps {
  userId: string;
  intervalMinutes?: number; // Default 5 minutes
}

const ExpirationProcessor: React.FC<ExpirationProcessorProps> = ({
  userId,
  intervalMinutes = 5,
}) => {
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Don't run if already processed in this session
    if (hasProcessedRef.current) return;

    const processExpirations = async () => {
      try {
        const response = await axiosClient.post("/api/me/process-expirations", {
          userId,
        });

        const results = response.data;

        if (results.summary.totalUploadsProcessed > 0) {
          console.log(
            `Auto-accepted ${results.summary.totalUploadsProcessed} expired uploads`
          );
        }
        if (results.summary.totalContractsProcessed > 0) {
          console.log(
            `Marked ${results.summary.totalContractsProcessed} contracts as not completed`
          );
        }
        if (results.summary.totalErrors > 0) {
          console.error(
            `${results.summary.totalErrors} errors occurred during processing`
          );
        }

        // Update localStorage with current timestamp
        localStorage.setItem("lastExpirationCheck", Date.now().toString());
        hasProcessedRef.current = true;
      } catch (error) {
        console.error("Error processing expirations:", error);
      }
    };

    const shouldProcess = () => {
      try {
        const lastCheck = localStorage.getItem("lastExpirationCheck");
        if (!lastCheck) {
          return true; // Never checked before
        }

        const lastCheckTime = parseInt(lastCheck, 10);
        const now = Date.now();
        const intervalMs = intervalMinutes * 60 * 1000;

        return now - lastCheckTime >= intervalMs;
      } catch (error) {
        console.error("Error checking localStorage:", error);
        return true; // If localStorage fails, process anyway
      }
    };

    // Check if we should process
    if (shouldProcess()) {
      console.log(
        `Processing expirations for user ${userId} (last check was > ${intervalMinutes} minutes ago)`
      );
      processExpirations();
    } else {
      console.log(
        `Skipping expiration processing for user ${userId} (checked recently)`
      );
      hasProcessedRef.current = true;
    }
  }, [userId, intervalMinutes]);

  // This component doesn't render anything
  return null;
};

export default ExpirationProcessor;
