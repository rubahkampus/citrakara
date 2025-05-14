// src/lib/utils/cookies.ts
export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as "strict" | "lax" | "none", // ✅ Explicitly type it
  path: "/",
};
// Get cookie value by name
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

// Set cookie (client-side)
export function setCookie(name: string, value: string, options: any = {}) {
  if (typeof document === "undefined") return;
  
  const opts = {
    path: "/",
    ...options,
  };
  
  let cookie = `${name}=${value}`;
  
  if (opts.maxAge) {
    cookie += `; max-age=${opts.maxAge}`;
  }
  
  if (opts.expires) {
    cookie += `; expires=${opts.expires.toUTCString()}`;
  }
  
  if (opts.path) {
    cookie += `; path=${opts.path}`;
  }
  
  if (opts.domain) {
    cookie += `; domain=${opts.domain}`;
  }
  
  if (opts.secure) {
    cookie += "; secure";
  }
  
  if (opts.sameSite) {
    cookie += `; samesite=${opts.sameSite}`;
  }
  
  document.cookie = cookie;
}

// Delete cookie (client-side)
export function deleteCookie(name: string, options: any = {}) {
  setCookie(name, "", {
    ...options,
    maxAge: -1,
  });
}