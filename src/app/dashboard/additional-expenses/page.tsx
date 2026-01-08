'use client';

import * as React from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { FilePdfIcon } from '@phosphor-icons/react/dist/ssr/FilePdf';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { Tooltip } from '@mui/material';
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
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { useAdditionalExpenses, AdditionalExpense, ExpenseCategory } from '@/contexts/additional-expense-context';
import { useEmployees } from '@/contexts/employee-context';
import { useUser } from '@/hooks/use-user';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

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
  amount: zod.number().gt(0, 'Amount must be greater than 0'),
}).refine((data) => {
  if (data.type === 'petrol' || data.type === 'maintenance' || data.type === 'variance' || data.type === 'salary') {
    return data.employeeId && data.employeeId.length > 0;
  }
  if (data.type === 'others') {
    return data.employeeId && data.employeeId.length > 0;
  }
  return true;
}, {
  message: 'Please select a driver/employee for this expense type',
  path: ['employeeId']
});

type ExpenseFormData = zod.infer<typeof expenseSchema>;

// Data will be loaded from context

// generateExpenseId function removed - using context for ID generation

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
  const { expenses, addExpense, updateExpense, deleteExpense } = useAdditionalExpenses();
  const { employees } = useEmployees();
  const { user } = useUser();
  
  // Check if user is a driver or manager
  const isDriver = user?.roles?.includes('driver') && !user?.roles?.includes('super_admin') && !user?.roles?.includes('manager');
  const isManager = user?.roles?.includes('manager') && !user?.roles?.includes('super_admin');
  const shouldHideDownloads = isDriver || isManager;
  const [open, setOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [expenseToDelete, setExpenseToDelete] = React.useState<Expense | null>(null);
  const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>([]);
  const [dateFrom, setDateFrom] = React.useState<string>(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = React.useState<string>(dayjs().format('YYYY-MM-DD'));
  const [expenseTypeFilter, setExpenseTypeFilter] = React.useState<string>('allTypes');
  const [employeeFilter, setEmployeeFilter] = React.useState<string>('allEmployees');
  
  // Loading states for actions
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
    // For driver users, filter expenses immediately
    if (isDriver && user?.employeeId) {
      setFilteredExpenses(mappedExpenses.filter(expense => expense.employeeId === user.employeeId));
    } else {
      setFilteredExpenses(mappedExpenses);
    }
  }, [mappedExpenses, isDriver, user?.employeeId]);

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
      date: new Date(expense.date),
      type: expense.category as ExpenseType,
      employeeId: expense.driverId || '',
      maintenanceName: expense.vendor || '',
      reason: expense.description || '',
      description: expense.description || '',
      amount: expense.amount,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingExpense(null);
    reset();
    setIsSaving(false);
  };

  const handleDelete = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setExpenseToDelete(expense);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      setIsDeleting(true);
      try {
        await deleteExpense(expenseToDelete.id);
        // Update filtered expenses to reflect the deletion
        setFilteredExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id));
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
      } catch (error) {
        console.error('Failed to delete expense:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
    setIsDeleting(false);
  };

  const applyFilters = React.useCallback(() => {
    let filtered = mappedExpenses;

    // For driver users, always filter by their employeeId
    if (isDriver && user?.employeeId) {
      filtered = filtered.filter(expense => expense.employeeId === user.employeeId);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = dayjs(dateFrom).startOf('day').utc();
      filtered = filtered.filter(expense =>
        dayjs(expense.date).utc().isSameOrAfter(fromDate)
      );
    }

    if (dateTo) {
      const toDate = dayjs(dateTo).endOf('day').utc();
      filtered = filtered.filter(expense =>
        dayjs(expense.date).utc().isSameOrBefore(toDate)
      );
    }

    // Expense type filter
    if (expenseTypeFilter !== 'allTypes') {
      filtered = filtered.filter(expense => expense.type === expenseTypeFilter);
    }

    // Employee filter (only for non-driver users)
    if (!isDriver && employeeFilter !== 'allEmployees') {
      filtered = filtered.filter(expense => expense.employeeId === employeeFilter);
    }

    setFilteredExpenses(filtered);
  }, [mappedExpenses, dateFrom, dateTo, expenseTypeFilter, employeeFilter, isDriver, user?.employeeId]);

  // Auto-apply filters when any filter changes
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleResetFilters = () => {
    setDateFrom(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
    setDateTo(dayjs().format('YYYY-MM-DD'));
    setExpenseTypeFilter('allTypes');
    setEmployeeFilter('allEmployees');
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
                  <td>${getExpenseTypeLabel(expense.category)}</td>
                  <td>${expense.driverName || '-'}</td>
                  <td>
                    ${expense.description ||
      (expense.category === 'maintenance' && expense.vendor) ||
      (expense.category === 'others' && expense.description) ||
      (expense.category === 'petrol' && 'Petrol Expense') ||
      (expense.category === 'salary' && 'Salary Payment') ||
      (expense.category === 'variance' && 'Variance Adjustment')}
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
        getExpenseTypeLabel(expense.category),
        expense.driverName || '-',
        expense.description ||
        (expense.category === 'maintenance' ? expense.vendor :
          expense.category === 'others' ? expense.description :
            expense.category === 'petrol' ? 'Petrol Expense' :
              expense.category === 'salary' ? 'Salary Payment' : 'Variance Adjustment'),
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

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSaving(true);
    try {
      const employee = employees.find(emp => emp.id === data.employeeId);

      // eslint-disable-next-line unicorn/prefer-ternary
      if (editingExpense) {
        // Edit existing expense using context
        await updateExpense(editingExpense.id, {
          title: data.description || 'Expense',
          description: data.description,
          category: data.type,
          amount: data.amount,
          currency: 'AED',
          date: data.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          driverId: data.employeeId,
          driverName: employee?.name,
          receiptNumber: undefined,
          vendor: data.maintenanceName,
          isReimbursable: true,
          status: 'pending',
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user', // You might want to get this from auth context
        });
      } else {
        // Add new expense using context
        await addExpense({
          title: data.description || 'Expense',
          description: data.description,
          category: data.type,
          amount: data.amount,
          currency: 'AED',
          date: data.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
          driverId: data.employeeId,
          driverName: employee?.name,
          designation: employee?.designation || 'driver',
          receiptNumber: undefined,
          vendor: data.maintenanceName,
          isReimbursable: true,
          status: 'pending',
          createdBy: 'current-user', // You might want to get this from auth context
        });
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Additional Expenses</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {!shouldHideDownloads && (
            <>
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
            </>
          )}
          {!isDriver && (
            <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpen}>
              Add Expense
            </Button>
          )}
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
            <MenuItem value="allTypes">All Types</MenuItem>
            <MenuItem value="petrol">Petrol</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="variance">Variance</MenuItem>
            <MenuItem value="salary">Salary</MenuItem>
            <MenuItem value="others">Others</MenuItem>
          </Select>
        </FormControl>
        {!isDriver && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Employee</InputLabel>
            <Select
              value={employeeFilter}
              label="Employee"
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <MenuItem value="allEmployees">All Employees</MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name} ({employee.designation.charAt(0).toUpperCase() + employee.designation.slice(1).toLowerCase()})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Tooltip title="Reset Filters">
          <IconButton onClick={handleResetFilters} color="primary">
            <ArrowClockwiseIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {filteredExpenses.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Designation</TableCell>
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
                    label={getExpenseTypeLabel(expense.category)}
                    size="small"
                    color={getExpenseTypeColor(expense.category)}
                  />
                </TableCell>
                <TableCell>{expense.driverName || '-'}</TableCell>
                <TableCell>{expense.designation ? expense.designation.charAt(0).toUpperCase() + expense.designation.slice(1).toLowerCase() : '-'}</TableCell>
                <TableCell>
                  {expense.description ||
                    (expense.category === 'maintenance' && expense.vendor) ||
                    (expense.category === 'others' && expense.description) ||
                    (expense.category === 'petrol' && 'Petrol Expense') ||
                    (expense.category === 'salary' && 'Salary Payment') ||
                    (expense.category === 'variance' && 'Variance Adjustment')}
                </TableCell>
                <TableCell>{expense.amount.toFixed(2)} AED</TableCell>
                <TableCell>{dayjs(expense.createdAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</TableCell>
                <TableCell>{dayjs(expense.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5}>
                    {!isDriver && (
                      <>
                        <IconButton onClick={() => handleEdit(expense)} size="small">
                          <PencilIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(expense.id)} size="small" color="error">
                          <TrashIcon />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 4 }}
        >
          No expenses found for the selected filters.
        </Typography>
      )}

      <Dialog open={open} onClose={isSaving ? undefined : handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ position: 'relative' }}>
            {isSaving && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
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
                <>
                  {isDriver && user?.employeeId ? (
                    <Controller
                      control={control}
                      name="employeeId"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={user.employeeId}
                          label="Employee"
                          disabled
                          fullWidth
                          helperText="Your expenses are automatically linked to your account"
                        />
                      )}
                    />
                  ) : (
                    <Controller
                      control={control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormControl fullWidth error={Boolean(errors.employeeId)}>
                          <InputLabel>Employee/Company</InputLabel>
                          <Select {...field} label="Employee/Company">
                            <MenuItem value="COMPANY">
                              Company
                            </MenuItem>
                            {employees.map((employee) => (
                              <MenuItem key={employee.id} value={employee.id}>
                                {employee.name} ({employee.designation.charAt(0).toUpperCase() + employee.designation.slice(1).toLowerCase()})
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
                </>
              )}


              {/* {watchedType === 'others' && (
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
              )} */}

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
            <Button onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={16} /> : (editingExpense ? <PencilIcon /> : <PlusIcon />)}
            >
              {isSaving ? (editingExpense ? 'Updating...' : 'Adding...') : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={isDeleting ? undefined : handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent sx={{ position: 'relative' }}>
          {isDeleting && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Typography>
            {`Are you sure you want to delete this expense? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <TrashIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
