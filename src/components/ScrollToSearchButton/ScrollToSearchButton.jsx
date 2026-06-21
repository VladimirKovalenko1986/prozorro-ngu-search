import { useEffect, useState } from "react";
import css from "./ScrollToSearchButton.module.css";

export default function ScrollToSearchButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > 400);
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToSearchPanel() {
    const searchPanel = document.getElementById("search-panel");

    if (searchPanel) {
      searchPanel.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <button
      className={`${css.button} ${isVisible ? css.visible : ""}`}
      type="button"
      onClick={scrollToSearchPanel}
      aria-label="Повернутись до пошуку"
    >
      ↑
    </button>
  );
}
