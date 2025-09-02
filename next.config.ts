import type { NextConfig } from "next";

// 정적 Export로 GitHub Pages 배포가 가능하도록 설정
// 리포지토리 페이지로 배포할 경우(basePath 필요 시)
// const repo = 'REPO_NAME';
// basePath: `/${repo}`,
// assetPrefix: `/${repo}/`,

const repoBasePath = process.env.GH_PAGES_BASEPATH;

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  ...(repoBasePath
    ? {
        basePath: `/${repoBasePath}`,
        assetPrefix: `/${repoBasePath}/`,
      }
    : {}),
};

export default nextConfig;
