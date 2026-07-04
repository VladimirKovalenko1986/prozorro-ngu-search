import { Fragment } from "react";
import { getCalculatedContractTotal } from "../../domain/prozorroRows.js";
import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import { formatQuantity } from "../../utils/formatQuantity.js";
import css from "./ResultsTable.module.css";

const columnClassNames = {
  "procedure-type-column": css.procedureTypeColumn,
  "supplier-column": css.supplierColumn,
  "buyer-column": css.buyerColumn,
  "status-column": css.statusColumn,
};

export default function ResultsTable({
  checkedLots,
  checkedProcedures,
  filterOptions,
  filters,
  loading,
  onFilterToggle,
  onLotChecked,
  onProcedureChecked,
  recentlyAddedProcedureId,
  results,
  showBuyerColumn,
  tableColumns,
}) {
  if (results.length === 0) {
    return (
      <section className={`${css.tablePanel} ${css.emptyPanel}`}>
        Поки немає результатів.
      </section>
    );
  }

  return (
    <section className={css.tablePanel}>
      <table className={css.table}>
        <thead>
          <tr>
            {tableColumns.map((column) => (
              <th
                className={columnClassNames[column.className] || ""}
                key={column.key}
              >
                <span className={css.columnTitle}>{column.label}</span>

                {filterOptions[column.key] ? (
                  <FilterMenu
                    activeCount={filters[column.key]?.length || 0}
                    disabled={loading}
                    filterKey={column.key}
                    onToggle={onFilterToggle}
                    options={filterOptions[column.key]}
                    selectedValues={filters[column.key] || []}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {results.map((procedure) => (
            <ProcedureRows
              checkedLots={checkedLots}
              checkedProcedures={checkedProcedures}
              key={procedure.id}
              onLotChecked={onLotChecked}
              onProcedureChecked={onProcedureChecked}
              procedure={procedure}
              recentlyAddedProcedureId={recentlyAddedProcedureId}
              showBuyerColumn={showBuyerColumn}
              tableColumns={tableColumns}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FilterMenu({
  activeCount,
  disabled,
  filterKey,
  onToggle,
  options,
  selectedValues,
}) {
  if (disabled) {
    return (
      <button className={css.filterTrigger} disabled type="button">
        Фільтр
      </button>
    );
  }

  return (
    <details className={css.filterMenu}>
      <summary>
        <span>Фільтр</span>
        {activeCount ? <span className={css.filterCount}>{activeCount}</span> : null}
      </summary>

      <div className={css.filterOptions}>
        {options.map((option) => (
          <label className={css.filterOption} key={option}>
            <input
              checked={selectedValues.includes(option)}
              onChange={() => onToggle(filterKey, option)}
              type="checkbox"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function ProcedureRows({
  checkedLots,
  checkedProcedures,
  onLotChecked,
  onProcedureChecked,
  procedure,
  recentlyAddedProcedureId,
  showBuyerColumn,
  tableColumns,
}) {
  const hasSpecificationRows = procedure.rows.some(
    (row) => row.specificationTitle,
  );
  const calculatedContractTotal = getCalculatedContractTotal(procedure.rows);
  const totalColSpan = tableColumns.length - 4;

  return (
    <Fragment>
      {procedure.rows.map((row, rowIndex) => {
        const isProcedureChecked = Boolean(checkedProcedures[procedure.tenderID]);
        const isLotChecked = Boolean(checkedLots[row.id]);
        const isChecked = isProcedureChecked || isLotChecked;
        const hasMultipleLots = procedure.rows.length > 1;
        const isRecentlyAdded = procedure.id === recentlyAddedProcedureId;

        return (
          <tr
            className={[
              isChecked ? css.processedRow : "",
              isRecentlyAdded ? css.rowAdded : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={row.id}
          >
            {rowIndex === 0 ? (
              <td className={css.procedureCell} rowSpan={procedure.rows.length}>
                <label className={css.processedCheck}>
                  <input
                    checked={isProcedureChecked}
                    onChange={() => onProcedureChecked(procedure.tenderID)}
                    type="checkbox"
                  />
                  <strong>{procedure.title}</strong>
                </label>
                <a
                  href={`https://prozorro.gov.ua/tender/${procedure.tenderID}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {procedure.tenderID}
                </a>
                <span>Дата процедури: {formatDate(procedure.procedureDate)}</span>
                <span>Статус: {procedure.tenderStatus}</span>
              </td>
            ) : null}

            {rowIndex === 0 ? (
              <td
                className={css.procedureTypeCell}
                rowSpan={procedure.rows.length}
              >
                {procedure.procedureType}
              </td>
            ) : null}

            {showBuyerColumn && rowIndex === 0 ? (
              <td className={css.buyerCell} rowSpan={procedure.rows.length}>
                {procedure.buyerUnit}
              </td>
            ) : null}

            <td>
              {row.lotNumber || row.specificationTitle ? (
                <label className={css.lotCheck}>
                  {row.lotNumber && hasMultipleLots ? (
                    <input
                      checked={isLotChecked}
                      disabled={isProcedureChecked}
                      onChange={() => onLotChecked(row.id)}
                      type="checkbox"
                    />
                  ) : null}
                  <span>
                    {row.lotNumber ? (
                      <>
                        <strong>Лот {row.lotNumber}</strong>
                        <span>{row.lotTitle}</span>
                      </>
                    ) : null}
                    {row.specificationTitle ? (
                      <span className={css.specificationTitle}>
                        <strong>Специфікація</strong>
                        <span>{row.specificationTitle}</span>
                      </span>
                    ) : null}
                  </span>
                </label>
              ) : (
                ""
              )}
            </td>

            <td>{formatMoney(row.expectedAmount, row.expectedCurrency)}</td>

            <td className={css.supplierCell}>{row.supplierName}</td>

            <td>
              {row.quantity ? (
                <>
                  <strong>
                    {formatQuantity(row.quantity)}
                    {row.unitName ? <span> {row.unitName}</span> : null}
                  </strong>
                  {row.specificationQuantities?.length ? (
                    <span className={css.specificationQuantities}>
                      {row.specificationQuantities.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </span>
                  ) : null}
                </>
              ) : (
                "Немає кількості"
              )}
            </td>

            <td>{formatMoney(row.unitPrice, row.contractCurrency)}</td>

            <td>{formatMoney(row.contractAmount, row.contractCurrency)}</td>

            <td>{formatDate(row.dateSigned)}</td>

            <td>{row.contractNumber}</td>

            <td className={css.statusCell}>
              <StatusBadge tone={procedure.tenderStatusTone}>
                {procedure.tenderStatus}
              </StatusBadge>
              <StatusBadge tone={row.contractStatusTone}>
                Договір: {row.contractStatus}
              </StatusBadge>
              <StatusBadge tone={row.awardStatusTone}>
                Award: {row.awardStatus}
              </StatusBadge>
            </td>
          </tr>
        );
      })}

      {hasSpecificationRows ? (
        <>
          <tr className={css.contractTotalRow}>
            <td colSpan={totalColSpan}>Сума договору за API</td>
            <td>
              {formatMoney(
                procedure.rows[0]?.contractTotalAmount,
                procedure.rows[0]?.contractCurrency,
              )}
            </td>
            <td colSpan="3" />
          </tr>
          <tr className={`${css.contractTotalRow} ${css.contractTotalRowFact}`}>
            <td colSpan={totalColSpan}>Сума по факту</td>
            <td>
              {formatMoney(
                calculatedContractTotal,
                procedure.rows[0]?.contractCurrency,
              )}
            </td>
            <td colSpan="3" />
          </tr>
        </>
      ) : null}
    </Fragment>
  );
}

function StatusBadge({ children, tone }) {
  return (
    <span className={`${css.statusBadge} ${css[`statusBadge${capitalize(tone)}`]}`}>
      {children}
    </span>
  );
}

function capitalize(value = "neutral") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
