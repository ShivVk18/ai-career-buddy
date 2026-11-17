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
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
