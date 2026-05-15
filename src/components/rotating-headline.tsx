"use client";

import { useEffect, useState } from "react";

function longest(arr: string[]): string {
  return arr.reduce((a, b) => (b.length > a.length ? b : a), arr[0] ?? "");
}

export function RotatingHeadline({
  titles,
  subtitles,
  className,
  subtitleClassName,
}: {
  titles: string[];
  subtitles?: string[];
  className?: string;
  subtitleClassName?: string;
}) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (titles.length < 2) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((p) => (p + 1) % titles.length);
        setShow(true);
      }, 400);
    }, 4600);
    return () => clearInterval(id);
  }, [titles.length]);

  const sub = subtitles?.[i] ?? subtitles?.[0];
  const longestTitle = longest(titles);
  const longestSub = subtitles ? longest(subtitles) : "";

  return (
    <>
      <h1 className={className} style={{ position: "relative" }}>
        {/* onzichtbare spacer = langste variant → vaste hoogte, geen wip */}
        <span aria-hidden style={{ visibility: "hidden" }}>
          {longestTitle}
        </span>
        <span
          className="transition-opacity duration-300"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            opacity: show ? 1 : 0,
          }}
        >
          {titles[i] ?? titles[0]}
        </span>
      </h1>
      {sub && (
        <p className={subtitleClassName} style={{ position: "relative" }}>
          <span aria-hidden style={{ visibility: "hidden" }}>
            {longestSub}
          </span>
          <span
            className="transition-opacity duration-300"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              opacity: show ? 1 : 0,
            }}
          >
            {sub}
          </span>
        </p>
      )}
    </>
  );
}
