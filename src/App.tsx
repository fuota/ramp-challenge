import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"
import { useCustomFetch } from "src/hooks/useCustomFetch"

import e from "express"


export function App() {
  const { data: employees,  ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [currentTransactions, setCurrentTransactions] = useState([] as any[])
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true)
  const [currentMode, setCurrentMode] = useState<"paginated" | "byEmployee">("paginated");

  // const transactions = useMemo(
  //   () =>  {
  //     if (paginatedTransactions?.data) {
  //       console.log("paginatedTransactions.data", paginatedTransactions)
  //       const alreadyTransactions = currentTransactions ? currentTransactions : []
  //       setCurrentTransactions([...alreadyTransactions, ...paginatedTransactions.data])
  //       if (paginatedTransactions.nextPage === null) {
  //         setHasMoreTransactions(false)
  //       } else {
  //         setHasMoreTransactions(true)
  //       }
  //     }
  //     else if (transactionsByEmployee) {
  //       setCurrentTransactions(transactionsByEmployee)
  //       setHasMoreTransactions(false)
  //     }
  //     else {
  //       setCurrentTransactions([])
  //     }
    
  //   return  paginatedTransactions?.data ?? transactionsByEmployee ?? null},
  //   [paginatedTransactions, transactionsByEmployee]
  // )

  useEffect(() => {
    if (currentMode === "paginated" && paginatedTransactions?.data) {
      console.log("paginatedTransactions.data", paginatedTransactions)
      if (paginatedTransactions.nextPage!=null && paginatedTransactions.nextPage-1 ===0){
        setCurrentTransactions(paginatedTransactions.data);
      }
      else{
        setCurrentTransactions([...currentTransactions, ...paginatedTransactions.data]);
      }
      
      if (paginatedTransactions.nextPage === null) {
        setHasMoreTransactions(false);
      } else {
        setHasMoreTransactions(true);
      }
    } else if (currentMode == "byEmployee" && transactionsByEmployee) {
      console.log("transactionsByEmployee", transactionsByEmployee)
      setCurrentTransactions(transactionsByEmployee);
      setHasMoreTransactions(false);
    }
    else {
      setCurrentTransactions([])
    }
  }, [currentMode, paginatedTransactions, transactionsByEmployee]);


  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsEmployeesLoading(false)
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
    
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
              console.log("newValue is null")
              setCurrentMode("paginated");
              await loadAllTransactions()
            }
            else{
              console.log(newValue.id)
              setCurrentMode("byEmployee");
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={currentTransactions} />

          {hasMoreTransactions && currentTransactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
