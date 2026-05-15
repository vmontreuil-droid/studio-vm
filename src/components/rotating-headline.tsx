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
      <h1 className={`relative ${className ?? ""}`}>
        {/* onzichtbare spacer = langste variant → vaste hoogte, geen wip */}
        <span aria-hidden className="invisible">
          {longestTitle}
        </span>
        <span
          className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${
            show ? "opacity-100" : "opacity-0"
          }`}
        >
          {titles[i] ?? titles[0]}
        </span>
      </h1>
      {sub && (
        <p className={`relative ${subtitleClassName ?? ""}`}>
          <span aria-hidden className="invisible">
            {longestSub}
          </span>
          <span
            className={`absolute inset-x-0 top-0 transition-opacity duration-300 ${
              show ? "opacity-100" : "opacity-0"
            }`}
          >
            {sub}
          </span>
        </p>
      )}
    </>
  );
}
