import { formatMoney } from "../../utils/formatMoney.js";
import { formatDate } from "../../utils/formatDate.js";

export default function ResultRow({ item }) {
  return (
    <tr>
      <td>
        <strong>{item.title}</strong>
      </td>

      <td>
        {item.quantity
          ? `${item.quantity} ${item.unitName}`
          : "Немає кількості"}
      </td>

      <td>{item.supplierName}</td>

      <td>{formatMoney(item.expectedAmount, item.expectedCurrency)}</td>

      <td>{formatMoney(item.contractAmount, item.contractCurrency)}</td>

      <td>{formatMoney(item.unitPrice, item.contractCurrency)}</td>

      <td>{item.contractNumber}</td>

      <td>{formatDate(item.dateSigned)}</td>

      <td>
        <a
          href={`https://prozorro.gov.ua/tender/${item.tenderID}`}
          target="_blank"
        >
          {item.tenderID}
        </a>
      </td>

      <td>
        {item.contractStatus}
        <span>{item.tenderStatus}</span>
      </td>
    </tr>
  );
}
