// src/components/dashboard/contracts/utils/formatters.ts

// Format date helper
export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Get status color helper
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "warning",
    accepted: "success",
    paid: "success",
    forcedAcceptedArtist: "success",
    forcedAcceptedClient: "success",
    forcedAccepted: "success",
    rejected: "error",
    cancelled: "error",
    disputed: "warning",
    open: "primary",
    awaitingReview: "warning",
    resolved: "success",
    submitted: "warning",
    active: "primary",
    completed: "success",
    completedLate: "success",
    cancelledClient: "error",
    cancelledClientLate: "error",
    cancelledArtist: "error",
    cancelledArtistLate: "error",
    notCompleted: "error",
  };

  return statusMap[status] || "default";
};
