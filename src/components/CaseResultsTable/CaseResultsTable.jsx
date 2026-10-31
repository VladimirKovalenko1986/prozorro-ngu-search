import { flattenCaseResults } from "../../domain/caseRows.js";
import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import { formatQuantity } from "../../utils/formatQuantity.js";
import tableCss from "../ResultsTable/ResultsTable.module.css";
import css from "./CaseResultsTable.module.css";

export default function CaseResultsTable({ results, showBuyerColumn }) {
  const rows = flattenCaseResults(results);

  if (rows.length === 0) {
    return (
      <section className={`${tableCss.tablePanel} ${tableCss.emptyPanel}`}>
        Поки немає результатів.
      </section>
    );
  }

  return (
    <section className={tableCss.tablePanel}>
      <table className={`${tableCss.table} ${css.table}`}>
        <thead>
          <tr>
            <th>Дата</th>
            {showBuyerColumn ? <th>Військова частина</th> : null}
            <th>Найменування</th>
            <th>Очікувана вартість</th>
            <th>Кількість</th>
            <th>Одиниця виміру</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDate(row.procedureDate)}</td>
              {showBuyerColumn ? <td>{row.buyerUnit}</td> : null}
              <td>
                <strong>{row.name}</strong>
                <a
                  href={`https://prozorro.gov.ua/tender/${row.tenderID}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.tenderID}
                </a>
              </td>
              <td>
                {row.showExpectedAmount
                  ? formatMoney(row.expectedAmount, row.expectedCurrency)
                  : ""}
              </td>
              <td>{row.quantity ? formatQuantity(row.quantity) : "Немає кількості"}</td>
              <td>{row.unitName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
