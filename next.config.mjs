/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

  // D41: the retired /tools previews go to their real routes. Redirects run before pages, so these work
  // even while the old preview pages still exist.
  async redirects() {
    return [
      { source: "/tools/resume", destination: "/resume", permanent: true },
      { source: "/tools/ats", destination: "/resume-parser", permanent: true },
      { source: "/tools/cover-letter", destination: "/cover-letter", permanent: true },
      { source: "/tools/cold-email", destination: "/cold-email", permanent: true },
      // Phase 6 (D44): the last two previews and the (index-less) /tools root.
      { source: "/tools/interview", destination: "/interview", permanent: true },
      { source: "/tools/roadmap", destination: "/roadmap", permanent: true },
      { source: "/tools", destination: "/dashboard", permanent: true },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
