'use client';

import * as React from 'react';
// import type { Metadata } from 'next';
import type { ChipProps } from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FilePdfIcon } from '@phosphor-icons/react/dist/ssr/FilePdf';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TableIcon } from '@phosphor-icons/react/dist/ssr/Table';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { useAdditionalExpenses, AdditionalExpense, ExpenseCategory } from '@/contexts/additional-expense-context';
import { useEmployees } from '@/contexts/employee-context';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

type ExpenseType = ExpenseCategory;

// Employee interface removed - using context

type Expense = AdditionalExpense;

// Employees will be loaded from context

const expenseSchema = zod.object({
  date: zod.date({ required_error: 'Date is required' }),
  type: zod.enum(['petrol', 'maintenance', 'variance', 'salary', 'others'], { required_error: 'Expense type is required' }),
  employeeId: zod.string().optional(),
  maintenanceName: zod.string().optional(),
  reason: zod.string().optional(),
  description: zod.string().optional(),
  amount: zod.number().min(0, 'Amount must be positive'),
}).refine((data) => {
  if (data.type === 'petrol' || data.type === 'maintenance' || data.type === 'variance' || data.type === 'salary') {
    return data.employeeId && data.employeeId.length > 0;
  }
  if (data.type === 'others') {
    return data.employeeId && data.employeeId.length > 0 && data.reason && data.reason.length > 0;
  }
  return true;
}, {
  message: 'Required fields are missing for the selected expense type',
  path: ['employeeId']
});

type ExpenseFormData = zod.infer<typeof expenseSchema>;

// Data will be loaded from context

function generateExpenseId(): string {
  const count = Math.floor(Math.random() * 1000) + 1;
  return `EXP-${count.toString().padStart(3, '0')}`;
}

const getExpenseTypeLabel = (type: ExpenseType) => {
  const labels = {
    petrol: 'Petrol',
    maintenance: 'Maintenance',
    variance: 'Variance',
    salary: 'Salary',
    others: 'Others'
  };
  return labels[type];
};


const getExpenseTypeColor = (type: ExpenseType): ChipProps['color'] => {
  const colors: Record<ExpenseType, ChipProps['color']> = {
    petrol: 'primary',
    maintenance: 'secondary',
    variance: 'warning',
    salary: 'success',
    others: 'info',
  };
  return colors[type];
};


export default function Page(): React.JSX.Element {
  const { expenses } = useAdditionalExpenses();
  const { employees } = useEmployees();
  const [open, setOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>([]);
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [expenseTypeFilter, setExpenseTypeFilter] = React.useState<string>('');
  const [employeeFilter, setEmployeeFilter] = React.useState<string>('');

  // Map context expenses to display format
  const mappedExpenses = React.useMemo(() => {
    return expenses.map(expense => ({
      ...expense,
      type: expense.category as ExpenseType,
      employeeId: expense.driverId,
      employeeName: expense.driverName,
      maintenanceName: expense.vendor,
      reason: expense.description,
    }));
  }, [expenses]);

  // Initialize filtered expenses
  React.useEffect(() => {
    setFilteredExpenses(mappedExpenses);
  }, [mappedExpenses]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date(),
      type: 'petrol',
      employeeId: '',
      maintenanceName: '',
      reason: '',
      description: '',
      amount: 0,
    },
  });

  const watchedType = watch('type');

  const handleOpen = () => {
    setEditingExpense(null);
    reset({
      date: new Date(),
      type: 'petrol',
      employeeId: '',
      maintenanceName: '',
      reason: '',
      description: '',
      amount: 0,
    });
    setOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    reset({
      date: expense.date,
      type: expense.type,
      employeeId: expense.employeeId || '',
      maintenanceName: expense.maintenanceName || '',
      reason: expense.reason || '',
      description: expense.description || '',
      amount: expense.amount,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingExpense(null);
    reset();
  };

  const handleDelete = (expenseId: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
    setExpenses(updatedExpenses);
    setFilteredExpenses(updatedExpenses);
  };

  const handleApplyFilter = () => {
    let filtered = mappedExpenses;

    // Filter by date range
    if (dateFrom && dateTo) {
      const fromDate = dayjs(dateFrom).startOf('day').utc();
      const toDate = dayjs(dateTo).endOf('day').utc();

      filtered = filtered.filter(expense => {
        const expenseDate = dayjs(expense.date).utc();
        return expenseDate.isAfter(fromDate) && expenseDate.isBefore(toDate);
      });
    }

    // Filter by expense type
    if (expenseTypeFilter) {
      filtered = filtered.filter(expense => expense.type === expenseTypeFilter);
    }

    // Filter by employee
    if (employeeFilter) {
      filtered = filtered.filter(expense => expense.employeeId === employeeFilter);
    }

    setFilteredExpenses(filtered);
  };

  const handleExportPdf = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Additional Expenses Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            h2 { 
              text-align: center; 
              color: #333; 
              margin-bottom: 20px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #333; 
              padding: 8px; 
              text-align: left; 
              font-size: 11px;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .date {
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Additional Expenses Report</h2>
            <div class="date">Generated on ${dayjs().tz('Asia/Dubai').format('MMMM D, YYYY h:mm A')} GST</div>
            ${dateFrom && dateTo ? `<div class="date">Period: ${dayjs(dateFrom).format('MMM D, YYYY')} - ${dayjs(dateTo).format('MMM D, YYYY')}</div>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Employee</th>
                <th>Description</th>
                <th>Amount (AED)</th>
                <th>Added</th>
                <th>Last Edited</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(expense => `
                <tr>
                  <td>${dayjs(expense.date).tz('Asia/Dubai').format('MMM D, YYYY')}</td>
                  <td>${getExpenseTypeLabel(expense.type)}</td>
                  <td>${expense.employeeName || '-'}</td>
                  <td>
                    ${expense.description ||
      (expense.type === 'maintenance' && expense.maintenanceName) ||
      (expense.type === 'others' && expense.reason) ||
      (expense.type === 'petrol' && 'Petrol Expense') ||
      (expense.type === 'salary' && 'Salary Payment') ||
      (expense.type === 'variance' && 'Variance Adjustment')}
                  </td>
                  <td>${expense.amount.toFixed(2)} AED</td>
                  <td>${dayjs(expense.createdAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</td>
                  <td>${dayjs(expense.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(htmlContent);
    printWindow?.document.close();

    setTimeout(() => {
      printWindow?.print();
    }, 500);
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Date', 'Type', 'Employee', 'Description', 'Amount (AED)', 'Added', 'Last Edited'],
      ...filteredExpenses.map(expense => [
        dayjs(expense.date).tz('Asia/Dubai').format('MMM D, YYYY'),
        getExpenseTypeLabel(expense.type),
        expense.employeeName || '-',
        expense.description ||
        (expense.type === 'maintenance' ? expense.maintenanceName :
          expense.type === 'others' ? expense.reason :
            expense.type === 'petrol' ? 'Petrol Expense' :
              expense.type === 'salary' ? 'Salary Payment' : 'Variance Adjustment'),
        `${expense.amount.toFixed(2)} AED`,
        dayjs(expense.createdAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A') + ' GST',
        dayjs(expense.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A') + ' GST'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `additional_expenses_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.append(link);
    link.click();
    link.remove();
  };

  const onSubmit = (data: ExpenseFormData) => {
    const employee = employees.find(emp => emp.id === data.employeeId);

    if (editingExpense) {
      // Edit existing expense
      const updatedExpenses = expenses.map(e =>
        e.id === editingExpense.id
          ? {
            ...e,
            date: data.date,
            type: data.type,
            employeeId: data.employeeId,
            employeeName: employee?.name,
            maintenanceName: data.maintenanceName,
            reason: data.reason,
            description: data.description,
            amount: data.amount,
            updatedAt: dayjs().utc().toDate()
          }
          : e
      );
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses);
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: generateExpenseId(),
        date: data.date,
        type: data.type,
        employeeId: data.employeeId,
        employeeName: employee?.name,
        maintenanceName: data.maintenanceName,
        reason: data.reason,
        description: data.description,
        amount: data.amount,
        createdAt: dayjs().utc().toDate(),
        updatedAt: dayjs().utc().toDate(),
      };
      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses);
    }
    handleClose();
  };


  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Additional Expenses</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            startIcon={<FilePdfIcon fontSize="var(--icon-fontSize-md)" />}
            onClick={handleExportPdf}
          >
            PDF
          </Button>
          <Button
            color="inherit"
            startIcon={<TableIcon fontSize="var(--icon-fontSize-md)" />}
            onClick={handleExportExcel}
          >
            Excel
          </Button>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpen}>
            Add Expense
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <TextField
          label="From Date"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="To Date"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Expense Type</InputLabel>
          <Select
            value={expenseTypeFilter}
            label="Expense Type"
            onChange={(e) => setExpenseTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="petrol">Petrol</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="variance">Variance</MenuItem>
            <MenuItem value="salary">Salary</MenuItem>
            <MenuItem value="others">Others</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Employee</InputLabel>
          <Select
            value={employeeFilter}
            label="Employee"
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <MenuItem value="">All Employees</MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.name} ({employee.designation.toUpperCase()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleApplyFilter}>
          Apply
        </Button>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Employee</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Added</TableCell>
            <TableCell>Last Edited</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredExpenses.map((expense) => (
            <TableRow hover key={expense.id}>
              <TableCell>{dayjs(expense.date).tz('Asia/Dubai').format('MMM D, YYYY')} GST</TableCell>
              <TableCell>
                <Chip
                  label={getExpenseTypeLabel(expense.type)}
                  size="small"
                  color={getExpenseTypeColor(expense.type)}
                />
              </TableCell>
              <TableCell>{expense.employeeName || '-'}</TableCell>
              <TableCell>
                {expense.description ||
                  (expense.type === 'maintenance' && expense.maintenanceName) ||
                  (expense.type === 'others' && expense.reason) ||
                  (expense.type === 'petrol' && 'Petrol Expense') ||
                  (expense.type === 'salary' && 'Salary Payment') ||
                  (expense.type === 'variance' && 'Variance Adjustment')}
              </TableCell>
              <TableCell>{expense.amount.toFixed(2)} AED</TableCell>
              <TableCell>{dayjs(expense.createdAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</TableCell>
              <TableCell>{dayjs(expense.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5}>
                  <IconButton onClick={() => handleEdit(expense)} size="small">
                    <PencilIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(expense.id)} size="small" color="error">
                    <TrashIcon />
                  </IconButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.date)}
                    helperText={errors.date?.message}
                    fullWidth
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    value={field.value ? dayjs(field.value).format('YYYY-MM-DD') : ''}
                  />
                )}
              />

              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.type)}>
                    <InputLabel>Expense Type</InputLabel>
                    <Select {...field} label="Expense Type">
                      <MenuItem value="petrol">Petrol</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="salary">Salary</MenuItem>
                      <MenuItem value="variance">Variance</MenuItem>
                      <MenuItem value="others">Others</MenuItem>
                    </Select>
                    {errors.type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.type.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {(watchedType === 'petrol' || watchedType === 'maintenance' || watchedType === 'variance' || watchedType === 'salary' || watchedType === 'others') && (
                <Controller
                  control={control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.employeeId)}>
                      <InputLabel>Employee/Company</InputLabel>
                      <Select {...field} label="Employee/Company">
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.designation.toUpperCase()})
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.employeeId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                          {errors.employeeId.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              )}


              {watchedType === 'others' && (
                <Controller
                  control={control}
                  name="reason"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Expense Reason"
                      error={Boolean(errors.reason)}
                      helperText={errors.reason?.message}
                      fullWidth
                    />
                  )}
                />
              )}

              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Amount (AED)"
                    type="text"
                    // inputProps={{ step: 0.01, min: 0 }}
                    error={Boolean(errors.amount)}
                    helperText={errors.amount?.message}
                    fullWidth
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                  />
                )}
              />
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
