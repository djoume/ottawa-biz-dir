import React, { useEffect, useState } from 'react';
import Tabletop from 'tabletop';
import {useTable, useFilters, useGlobalFilter} from 'react-table';
import matchSorter from 'match-sorter';
import {Form, Table} from 'react-bootstrap';

import 'bootstrap/dist/css/bootstrap.min.css';


function GlobalFilter({
  globalFilter,
  setGlobalFilter,
}) {
  return (
    <Form>
      <Form.Group controlId="searchForm">
        <Form.Control
          type="text"
          size="lg"
          placeholder="Type here to search"
          value={globalFilter || ''}
          onChange={e => {
            setGlobalFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
          }}
          />
      </Form.Group>
    </Form>
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

fuzzyTextFilterFn.autoRemove = val => !val

const App = (props) => {
  const [sheet, setSheet] = useState({
    data: [],
  })

  useEffect(() => {
    Tabletop.init({
      key: '1asa5VMdHOr4LTOx34EPGxkN90Oy48niuPjCQu83cx_s',
      callback: (_, tabletop) => {
        console.log(tabletop);
        setSheet({
          data: tabletop.sheets('Master').all()
        })
      },
      simpleSheet: true
    })
  }, [])

  const data = React.useMemo(
    () => sheet.data.filter(obj => obj.Business.length > 1),
    [sheet]
  );
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'Business'
      },
      {
        Header: 'Status',
        accessor: 'Open?'
      },
      {
        Header: 'What is available',
        accessor: 'What is available'
      },
      {
        Header: 'Type of business',
        accessor: 'Category'
      },
      {
        Header: 'Neighbourhood',
        accessor: 'Neighbourhood'
      },
      {
        Header: 'Website',
        accessor: 'WebsiteURL'
      },
      {
        Header: 'Facebook',
        accessor: 'FacebookURL'
      },
      {
        Header: 'Phone',
        accessor: 'Phone'
      },
      {
        Header: 'Address',
        accessor: 'Address'
      }
    ],
    [],
  );

  const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  );

  const { 
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable(
    {
      columns, 
      data,
      filterTypes,
    },
    useFilters,
    useGlobalFilter,
  )
  

  return (
    <div className="App">
    <GlobalFilter
      preGlobalFilteredRows={preGlobalFilteredRows}
      globalFilter={state.globalFilter}
      setGlobalFilter={setGlobalFilter}
    />
    <Table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
      {rows.map(row => {
        prepareRow(row)
        return (
          <tr {...row.getRowProps()}>
            {row.cells.map(cell => {
              return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
            })}
          </tr>
        )
      })}
    </tbody>
    </Table>
  </div>)
}

export default App;