import css from "./StorageTransferButtons.module.css";

function readStorageObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch {
        reject(new Error("Файл не схожий на експорт прогресу"));
      }
    };
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsText(file);
  });
}

export default function StorageTransferButtons({
  disabled,
  onImport,
  storageKeys,
}) {
  function handleExport() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      procedures: readStorageObject(storageKeys.procedures),
      lots: readStorageObject(storageKeys.lots),
    };

    downloadJson("prozorro-ngu-progress.json", payload);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];

    event.target.value = "";
    if (!file) return;

    try {
      const payload = await readJsonFile(file);

      onImport({
        procedures: payload.procedures || {},
        lots: payload.lots || {},
      });
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className={css.group}>
      <button
        className={`${css.button} ${css.exportButton}`}
        disabled={disabled}
        onClick={handleExport}
        type="button"
      >
        <span className={css.icon}>⇧</span>
        Витягнути
      </button>

      <label className={`${css.button} ${css.importButton}`}>
        <span className={css.icon}>⇩</span>
        Надати
        <input
          accept="application/json,.json"
          disabled={disabled}
          onChange={handleImport}
          type="file"
        />
      </label>
    </div>
  );
}
