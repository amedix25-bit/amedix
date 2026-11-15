import React, { useCallback, useEffect, useRef, useState } from "react";

// Fits its content into the visible height of the screen: the content is
// measured and scaled down when it is taller than the space below it, so the
// overview never needs a page scroll. Phones keep their normal scrolling.
export default function FitToHeight({ children, className = "", fitKey, bottomGap = 16 }) {
  const boxRef = useRef(null);
  const contentRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;

    // Below the desktop breakpoint the layout scrolls as usual.
    if (window.innerWidth < 1024) {
      setZoom(1);
      return;
    }

    const available = window.innerHeight - box.getBoundingClientRect().top - bottomGap;
    if (available <= 0) return;

    let next = 1;
    content.style.zoom = "1";
    let height = content.getBoundingClientRect().height;
    let guard = 0;
    while (height > available + 1 && next > 0.4 && guard < 8) {
      next = Math.max(0.4, next * (available / height));
      content.style.zoom = String(next);
      height = content.getBoundingClientRect().height;
      guard += 1;
    }
    content.style.zoom = "";
    setZoom(next);
  }, [bottomGap]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fit]);

  useEffect(() => {
    const timer = setTimeout(fit, 80);
    return () => clearTimeout(timer);
  }, [fit, fitKey]);

  return (
    <div ref={boxRef} className={className}>
      <div ref={contentRef} style={{ zoom }}>
        {children}
      </div>
    </div>
  );
}