"use client";

import { useEffect, useState } from "react";

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

  return (
    <>
      <h1 className={className}>
        <span
          className="inline-block transition-opacity duration-300"
          style={{ opacity: show ? 1 : 0 }}
        >
          {titles[i] ?? titles[0]}
        </span>
      </h1>
      {sub && (
        <p className={subtitleClassName}>
          <span
            className="inline-block transition-opacity duration-300"
            style={{ opacity: show ? 1 : 0 }}
          >
            {sub}
          </span>
        </p>
      )}
    </>
  );
}
