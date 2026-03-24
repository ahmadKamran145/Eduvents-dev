"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";

interface AdPluggZoneProps {
  zoneName: string;
  className?: string;
}

const AdPluggZone: React.FC<AdPluggZoneProps> = ({ zoneName, className }) => {
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Tell AdPlugg to rescan the DOM and fill this zone
    const win = window as any;
    if (win.adplugg && typeof win.adplugg.fill === "function") {
      win.adplugg.fill(zoneRef.current);
    } else if (win.AdPlugg && typeof win.AdPlugg.fill === "function") {
      win.AdPlugg.fill(zoneRef.current);
    }
  }, [zoneName]);

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center w-full my-6",
        className,
      )}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-1">
        Advertisement
      </p>
      <div
        ref={zoneRef}
        className="adplugg-tag overflow-hidden bg-muted/20 flex items-center justify-center rounded-md"
        data-adplugg-zone={zoneName}
      >
        {/* AdPlugg ad creative will be injected here */}
      </div>
    </div>
  );
};

export default AdPluggZone;
