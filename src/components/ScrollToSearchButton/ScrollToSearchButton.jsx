import { useEffect, useState } from "react";
import css from "./ScrollToSearchButton.module.css";

export default function ScrollToSearchButton({
  targetId = "search-panel",
  ariaLabel = "Повернутись до пошуку",
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 400);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTarget() {
    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <button
      className={`${css.button} ${isVisible ? css.visible : ""}`}
      type="button"
      onClick={scrollToTarget}
      aria-label={ariaLabel}
    >
      ↑
    </button>
  );
}
