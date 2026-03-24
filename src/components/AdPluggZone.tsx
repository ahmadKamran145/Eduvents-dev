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
    const container = zoneRef.current;

    // Make all ad links open in a new tab
    const openLinksInNewTab = (root: HTMLElement) => {
      root.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
    };

    // Watch for dynamically injected ad content
    let observer: MutationObserver | undefined;
    if (container) {
      observer = new MutationObserver(() => openLinksInNewTab(container));
      observer.observe(container, { childList: true, subtree: true });
    }

    const tryFill = () => {
      // Re-run the AdPlugg script to scan new zones
      const existingScript = document.getElementById("adplugg-adjs");
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement("script");
      script.id = "adplugg-adjs";
      script.async = true;
      script.src = "//www.adplugg.com/serve/A48226912/js/1.1/ad.js";
      document.head.appendChild(script);
    };

    // Small delay to ensure the DOM is ready
    const timeout = setTimeout(tryFill, 100);
    return () => {
      clearTimeout(timeout);
      observer?.disconnect();
    };
  }, [zoneName]);

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center w-full my-6",
        className,
      )}
    >
      {/* <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mb-1">
        Advertisement
      </p> */}
      <div
        ref={zoneRef}
        className="adplugg-tag overflow-hidden flex items-center justify-center rounded-md max-w-[900px] max-h-[150px]"
        data-adplugg-zone={zoneName}
      >
        {/* AdPlugg ad creative will be injected here */}
      </div>
    </div>
  );
};

export default AdPluggZone;
