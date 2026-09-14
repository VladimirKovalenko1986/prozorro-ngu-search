function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getColumnName(index) {
  let name = "";
  let currentIndex = index;

  do {
    name = String.fromCharCode(65 + (currentIndex % 26)) + name;
    currentIndex = Math.floor(currentIndex / 26) - 1;
  } while (currentIndex >= 0);

  return name;
}

function buildCell(cell, columnIndex, rowIndex) {
  const reference = `${getColumnName(columnIndex)}${rowIndex + 1}`;

  if (cell.type === "number" && Number.isFinite(Number(cell.value))) {
    const style = cell.format === "#,##0" ? 2 : 1;
    return `<c r="${reference}" s="${style}"><v>${Number(cell.value)}</v></c>`;
  }

  const style = cell.type === "header" ? 3 : 0;
  return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
}

function buildSheetXml(columns, rows) {
  const allRows = [
    columns.map((value) => ({ type: "header", value })),
    ...rows,
  ];
  const rowXml = allRows
    .map(
      (row, rowIndex) => {
        const rowAttributes =
          rowIndex === 0 ? ` r="1" ht="32" customHeight="1"` : ` r="${rowIndex + 1}"`;

        return `<row${rowAttributes}>${row
          .map((cell, columnIndex) => buildCell(cell, columnIndex, rowIndex))
          .join("")}</row>`;
      },
    )
    .join("");
  const columnsXml = columns
    .map((column, index) => {
      const longestValue = Math.max(
        String(column).length,
        ...rows.map((row) => String(row[index]?.value ?? "").length),
      );
      const width = Math.min(Math.max(longestValue + 2, 12), 42);
      const columnIndex = index + 1;

      return `<col min="${columnIndex}" max="${columnIndex}" width="${width}" customWidth="1"/>`;
    })
    .join("");
  const lastCell = `${getColumnName(columns.length - 1)}${allRows.length}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${columnsXml}</cols>
  <sheetData>${rowXml}</sheetData>
  <autoFilter ref="A1:${lastCell}"/>
</worksheet>`;
}

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const rootRelationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Договори" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

const workbookRelationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
    <numFmt numFmtId="165" formatCode="#,##0"/>
  </numFmts>
  <fonts count="2">
    <font><sz val="11"/><name val="Aptos"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`;

export async function createXlsxFile({ columns, rows }) {
  const { strToU8, zipSync } = await import("fflate");

  return zipSync(
    {
      "[Content_Types].xml": strToU8(contentTypesXml),
      "_rels/.rels": strToU8(rootRelationshipsXml),
      "xl/_rels/workbook.xml.rels": strToU8(workbookRelationshipsXml),
      "xl/styles.xml": strToU8(stylesXml),
      "xl/workbook.xml": strToU8(workbookXml),
      "xl/worksheets/sheet1.xml": strToU8(buildSheetXml(columns, rows)),
    },
    { level: 6 },
  );
}
