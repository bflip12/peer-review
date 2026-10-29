import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Memoizes components and hooks at build time, so code does not call useMemo or
  // useCallback for performance (ADR 0021).
  reactCompiler: true,
  partialPrefetching: true
};

export default nextConfig;
