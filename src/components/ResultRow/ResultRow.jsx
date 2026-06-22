import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";

function ResultRow({ item }) {
  const tenderUrl = `https://prozorro.gov.ua/tender/${item.tenderID}`;

  return (
    <tr>
      <td>{item.lotNumber ? `Лот ${item.lotNumber}` : "Без лотів"}</td>

      <td>
        <strong>{item.title}</strong>
      </td>

      <td>{formatMoney(item.expectedAmount, item.expectedCurrency)}</td>

      <td>{formatDate(item.contractDate)}</td>

      <td>{formatMoney(item.contractAmount, item.contractCurrency)}</td>

      <td>{formatMoney(item.unitPrice, item.contractCurrency)}</td>

      <td>{item.supplierName}</td>

      <td>
        {item.quantity ? (
          <>
            {item.quantity}
            {item.unitName ? <span> {item.unitName}</span> : null}
          </>
        ) : (
          "Немає кількості"
        )}
      </td>

      <td>{formatDate(item.dateSigned)}</td>

      <td>{item.contractNumber}</td>

      <td>
        <a href={tenderUrl} target="_blank" rel="noreferrer">
          {item.tenderID}
        </a>
      </td>

      <td>
        <div>{item.tenderStatus}</div>
        <span className="muted">Договір: {item.contractStatus}</span>
        <span className="muted">Award: {item.awardStatus}</span>
      </td>
    </tr>
  );
}

export default ResultRow;
