'use client';

import * as React from 'react';
import type { Metadata } from 'next';
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

import { config } from '@/config';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

type ExpenseType = 'petrol' | 'maintenance' | 'salary' | 'variance' | 'others';

interface Employee {
  id: string;
  name: string;
  role: 'driver' | 'manager' | 'ceo';
}

interface Expense {
  id: string;
  date: Date;
  type: ExpenseType;
  employeeId?: string;
  employeeName?: string;
  maintenanceName?: string;
  reason?: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const employees: Employee[] = [
  { id: 'EMP-001', name: 'Rahul Kumar', role: 'driver' },
  { id: 'EMP-002', name: 'Vijay Anand', role: 'driver' },
  { id: 'EMP-003', name: 'Karthik', role: 'driver' },
  { id: 'EMP-004', name: 'Senthil', role: 'driver' },
  { id: 'EMP-005', name: 'Suresh', role: 'driver' },
  { id: 'EMP-006', name: 'Rajesh Kumar', role: 'manager' },
  { id: 'EMP-007', name: 'Priya Sharma', role: 'ceo' },
  { id: 'COMP-001', name: 'Quality Food Stuffs', role: 'ceo' },
];

const expenseSchema = zod.object({
  date: zod.date({ required_error: 'Date is required' }),
  type: zod.enum(['petrol', 'maintenance', 'salary', 'variance', 'others'], { required_error: 'Expense type is required' }),
  employeeId: zod.string().optional(),
  maintenanceName: zod.string().optional(),
  reason: zod.string().optional(),
  amount: zod.number().min(0, 'Amount must be positive'),
}).refine((data) => {
  if (data.type === 'petrol' || data.type === 'salary' || data.type === 'variance') {
    return data.employeeId && data.employeeId.length > 0;
  }
  if (data.type === 'maintenance') {
    return data.employeeId && data.employeeId.length > 0 && data.maintenanceName && data.maintenanceName.length > 0;
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

const initialExpenses: Expense[] = [
  {
    id: 'EXP-001',
    date: dayjs().subtract(2, 'day').utc().toDate(),
    type: 'petrol',
    employeeId: 'EMP-001',
    employeeName: 'Rahul Kumar',
    amount: 150.00,
    createdAt: dayjs().subtract(2, 'day').utc().toDate(),
    updatedAt: dayjs().subtract(2, 'day').utc().toDate(),
  },
  {
    id: 'EXP-002',
    date: dayjs().subtract(1, 'day').utc().toDate(),
    type: 'maintenance',
    employeeId: 'EMP-006',
    employeeName: 'Rajesh Kumar',
    maintenanceName: 'Engine Oil Change',
    amount: 250.00,
    createdAt: dayjs().subtract(1, 'day').utc().toDate(),
    updatedAt: dayjs().subtract(1, 'day').utc().toDate(),
  },
  {
    id: 'EXP-003',
    date: dayjs().subtract(3, 'day').utc().toDate(),
    type: 'salary',
    employeeId: 'EMP-002',
    employeeName: 'Vijay Anand',
    amount: 2500.00,
    createdAt: dayjs().subtract(3, 'day').utc().toDate(),
    updatedAt: dayjs().subtract(3, 'day').utc().toDate(),
  },
];

function generateExpenseId(): string {
  const count = Math.floor(Math.random() * 1000) + 1;
  return `EXP-${count.toString().padStart(3, '0')}`;
}

export default function Page(): React.JSX.Element {
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses);
  const [open, setOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>(initialExpenses);
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [expenseTypeFilter, setExpenseTypeFilter] = React.useState<string>('');

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
    let filtered = expenses;

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
                    ${expense.type === 'maintenance' && expense.maintenanceName}
                    ${expense.type === 'others' && expense.reason}
                    ${expense.type === 'petrol' && 'Petrol Expense'}
                    ${expense.type === 'salary' && 'Salary Payment'}
                    ${expense.type === 'variance' && 'Variance Adjustment'}
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
        expense.type === 'maintenance' ? expense.maintenanceName : 
        expense.type === 'others' ? expense.reason :
        expense.type === 'petrol' ? 'Petrol Expense' :
        expense.type === 'salary' ? 'Salary Payment' : 'Variance Adjustment',
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getExpenseTypeLabel = (type: ExpenseType) => {
    const labels = {
      petrol: 'Petrol',
      maintenance: 'Maintenance',
      salary: 'Salary',
      variance: 'Variance',
      others: 'Others'
    };
    return labels[type];
  };

  const getExpenseTypeColor = (type: ExpenseType) => {
    const colors = {
      petrol: 'primary',
      maintenance: 'secondary',
      salary: 'success',
      variance: 'warning',
      others: 'info'
    };
    return colors[type];
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
            <MenuItem value="salary">Salary</MenuItem>
            <MenuItem value="variance">Variance</MenuItem>
            <MenuItem value="others">Others</MenuItem>
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
                  color={getExpenseTypeColor(expense.type) as any}
                />
              </TableCell>
              <TableCell>{expense.employeeName || '-'}</TableCell>
              <TableCell>
                {expense.type === 'maintenance' && expense.maintenanceName}
                {expense.type === 'others' && expense.reason}
                {expense.type === 'petrol' && 'Petrol Expense'}
                {expense.type === 'salary' && 'Salary Payment'}
                {expense.type === 'variance' && 'Variance Adjustment'}
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

              {(watchedType === 'petrol' || watchedType === 'maintenance' || watchedType === 'salary' || watchedType === 'variance' || watchedType === 'others') && (
                <Controller
                  control={control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.employeeId)}>
                      <InputLabel>Employee/Company</InputLabel>
                      <Select {...field} label="Employee/Company">
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.role.toUpperCase()})
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

              {watchedType === 'maintenance' && (
                <Controller
                  control={control}
                  name="maintenanceName"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Maintenance Description"
                      error={Boolean(errors.maintenanceName)}
                      helperText={errors.maintenanceName?.message}
                      fullWidth
                    />
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
                    type="number"
                    inputProps={{ step: 0.01, min: 0 }}
                    error={Boolean(errors.amount)}
                    helperText={errors.amount?.message}
                    fullWidth
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
