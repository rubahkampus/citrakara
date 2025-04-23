// src/config.ts
export const authConfig = {
  accessTokenExpiry: 15 * 60, // 15 minutes
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
  bcryptSaltRounds: 10,
};

export const defaultUserConfig = {
  profilePicture: "/default-profile.png",
  banner: "/default-banner.jpg",
};
