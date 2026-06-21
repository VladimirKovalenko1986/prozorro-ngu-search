import { formatMoney } from "../../utils/formatMoney.js";

export default function ResultRow({ item }) {
  return (
    <tr>
      <td>
        <strong>{item.title}</strong>
        <span>{item.buyer}</span>
      </td>
      <td>{formatMoney(item.amount, item.currency)}</td>
      <td>{item.contractID}</td>
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
