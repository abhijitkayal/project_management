"use client";

import { CSSProperties, useMemo } from "react";

type HoverTooltipProps = {
  target: HTMLElement | null;
};

export default function HoverTooltip({ target }: HoverTooltipProps) {
  const style = useMemo<CSSProperties | null>(() => {
    if (!target) return null;

    const rect = target.getBoundingClientRect();
    return {
      position: "absolute",
      top: rect.top + window.scrollY + rect.height / 2,
      left: rect.right + 10,
    };
  }, [target]);

  if (!target || !style) return null;

  return (
    <div
      className="notion-tooltip"
      style={style}
    >
      <div className="tooltip-title">Table view</div>
      <div className="tooltip-desc">
        Add a table view for a new or existing data source
      </div>
    </div>
  );
}