import React from "react";

const MainLayout = async ({ children }) => {
  return (
    <div className="w-full h-screen">
      {children}
    </div>
  );
};

export default MainLayout;
