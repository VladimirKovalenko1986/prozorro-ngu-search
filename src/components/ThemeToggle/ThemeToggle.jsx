import css from "./ThemeToggle.module.css";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Увімкнути світлу тему" : "Увімкнути темну тему"}
      className={css.button}
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true" className={css.icon}>
        {isDark ? "☀" : "☾"}
      </span>
      {isDark ? "Світла тема" : "Темна тема"}
    </button>
  );
}
