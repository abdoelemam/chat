import React from "react";

const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-base-300 rounded-full animate-pulse" />
          <div className="w-24 h-4 bg-base-300 rounded animate-pulse hidden lg:block" />
        </div>
      </div>
      <div className="overflow-y-auto w-full py-3">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-base-300 rounded-full animate-pulse mx-auto lg:mx-0" />
            <div className="hidden lg:block text-left min-w-0 flex-1 space-y-2">
              <div className="w-32 h-4 bg-base-300 rounded animate-pulse" />
              <div className="w-24 h-3 bg-base-300 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
