import React from "react";

const DateSeparator = ({ date }) => {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-base-300 text-base-content/70 text-xs px-3 py-1 rounded-full shadow-sm">
        {date}
      </div>
    </div>
  );
};

export default DateSeparator;
