/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },

   api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
  
   
};

export default nextConfig;
