'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { useEmployees, Employee } from '@/contexts/employee-context';
import { useNotifications } from '@/contexts/notification-context';
import { Tooltip } from '@mui/material';

export default function Page(): React.JSX.Element {
  const { employees, addEmployee, updateEmployee, deleteEmployee, updateDriverBalance } = useEmployees();
  const { showSuccess, showError } = useNotifications();

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [balanceHistoryDialogOpen, setBalanceHistoryDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = React.useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
    role: 'driver' as 'driver' | 'staff',
    location: '',
    routeName: '',
    balance: '',
  });

  type FormErrors = {
    name?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    role?: string;
    location?: string;
    routeName?: string;
    balance?: string;
  };

  // Validation errors
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});

  const handleAddClick = () => {
    setFormData({ name: '', phoneNumber: '', email: '', address: '', role: 'driver', location: '', routeName: '', balance: '' });
    setFormErrors({});
    setAddDialogOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      phoneNumber: employee.phoneNumber.replace('+971', '').trim(),
      email: employee.email,
      address: employee.address,
      role: employee.designation === 'ceo' ? 'staff' : employee.designation,
      location: employee.location || '',
      routeName: employee.routeName || '',
      balance: employee.balance?.toString() || '',
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleBalanceHistoryClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setBalanceHistoryDialogOpen(true);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    const newRole = event.target.value as 'driver' | 'staff';
    setFormData(prev => ({ 
      ...prev, 
      role: newRole,
      // Clear location, routeName, and balance if staff is selected
      location: newRole === 'staff' ? '' : prev.location,
      routeName: newRole === 'staff' ? '' : prev.routeName,
      balance: newRole === 'staff' ? '' : prev.balance,
    }));
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    // Phone number validation: must be exactly 9 digits
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{9}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be exactly 9 digits';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Address validation
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    // Only validate location, routeName, and balance if role is driver
    if (formData.role === 'driver') {
      if (!formData.location.trim()) {
        errors.location = 'Location is required for drivers';
      }

      if (!formData.routeName.trim()) {
        errors.routeName = 'Route name is required for drivers';
      }

      if (!formData.balance.trim()) {
        errors.balance = 'Balance is required for drivers';
      } else if (Number.isNaN(Number(formData.balance))) {
        errors.balance = 'Balance must be a valid number';
      } else if (Number(formData.balance) < 0) {
        errors.balance = 'Balance must be a positive number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async () => {
    if (validateForm() && formData.name && formData.phoneNumber) {
      const newEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        designation: formData.role,
        phoneNumber: `+971${formData.phoneNumber}`,
        email: formData.email,
        address: formData.address,
        routeName: formData.role === 'driver' ? formData.routeName : undefined,
        location: formData.role === 'driver' ? formData.location : undefined,
        balance: formData.role === 'driver' ? Number(formData.balance) : undefined,
        balanceHistory: formData.role === 'driver' ? [
          {
            version: 1,
            balance: Number(formData.balance),
            updatedAt: new Date(),
            reason: 'initial',
            updatedBy: 'EMP-001', // Assuming CEO creates new employees
          }
        ] : undefined,
        hireDate: new Date(),
        isActive: true,
      };
      try {
        await addEmployee(newEmployee);
        showSuccess('Employee added successfully!');
        setAddDialogOpen(false);
      } catch {
        showError('Failed to add employee. Please try again.');
      }
    }
  };

  const handleEditSubmit = async () => {
    if (selectedEmployee && validateForm()) {
      const updates: Partial<Employee> = {
        name: formData.name,
        phoneNumber: `+971${formData.phoneNumber}`,
        email: formData.email,
        address: formData.address,
        designation: formData.role,
        location: formData.role === 'driver' ? formData.location : undefined,
        routeName: formData.role === 'driver' ? formData.routeName : undefined,
      };

      // Handle balance update for drivers
      if (formData.role === 'driver' && formData.balance !== selectedEmployee.balance?.toString()) {
        const newBalance = Number(formData.balance);
        const previousBalance = selectedEmployee.balance || 0;
        
        if (newBalance !== previousBalance) {
          // Use the updateDriverBalance method to maintain history
          updateDriverBalance(selectedEmployee.id, newBalance, 'manual_adjustment', 'EMP-001');
        }
      }

      try {
        await updateEmployee(selectedEmployee.id, updates);
        showSuccess('Employee updated successfully!');
        setEditDialogOpen(false);
        setSelectedEmployee(null);
      } catch {
        showError('Failed to update employee. Please try again.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEmployee) {
      try {
        deleteEmployee(selectedEmployee.id);
        showSuccess('Employee deleted successfully!');
        setDeleteDialogOpen(false);
        setSelectedEmployee(null);
      } catch {
        showError('Failed to delete employee. Please try again.');
      }
    }
  };

  const handleCloseDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setBalanceHistoryDialogOpen(false);
    setSelectedEmployee(null);
    setFormErrors({});
  };

  // Display employees sorted by role (CEO first, then drivers, then staff)
  const sortedEmployees = React.useMemo(() => {
    return [...employees].sort((a, b) => {
      const roleOrder = { ceo: 0, driver: 1, staff: 2 };
      return roleOrder[a.designation] - roleOrder[b.designation];
    });
  }, [employees]);

  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Employees</Typography>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            onClick={handleAddClick}
          >
            Add
          </Button>
        </div>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Phone number</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Route name</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedEmployees.map((employee) => (
            <TableRow hover key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.phoneNumber}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.address}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {employee.designation === 'ceo' ? 'CEO' : employee.designation}
              </TableCell>
              <TableCell>{employee.location || '-'}</TableCell>
              <TableCell>{employee.routeName || '-'}</TableCell>
              <TableCell>
                {employee.designation === 'driver' ? (
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                    AED {employee.balance?.toFixed(2) || '0.00'}
                  </Typography>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5}>
                  {employee.designation !== 'ceo' && (
                    <>
                      <Tooltip title="Edit Employee">
                        <IconButton onClick={() => handleEditClick(employee)} size="small">
                          <PencilIcon />
                        </IconButton>
                      </Tooltip>

                      {employee.designation === 'driver' && (
                        <Tooltip title="Balance History">
                          <IconButton onClick={() => handleBalanceHistoryClick(employee)} size="small" color="info">
                            💰
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Delete Employee">
                        <IconButton onClick={() => handleDeleteClick(employee)} size="small" color="error">
                          <TrashIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={handleFormChange('name')}
              fullWidth
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleFormChange('phoneNumber')}
              fullWidth
              required
              error={!!formErrors.phoneNumber}
              helperText={formErrors.phoneNumber || 'Enter 9 digits (e.g., 5012345678). +971 will be added automatically'}
              placeholder="552345678"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+971</Typography>,
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleFormChange('email')}
              fullWidth
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              placeholder="employee@company.com"
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={handleFormChange('address')}
              fullWidth
              required
              error={!!formErrors.address}
              helperText={formErrors.address}
              placeholder="123 Main Street, Dubai, UAE"
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
            {formData.role === 'driver' && (
              <>
                <TextField
                  label="Location"
                  value={formData.location}
                  onChange={handleFormChange('location')}
                  fullWidth
                  required
                  error={!!formErrors.location}
                  helperText={formErrors.location}
                />
                <TextField
                  label="Route Name"
                  value={formData.routeName}
                  onChange={handleFormChange('routeName')}
                  fullWidth
                  required
                  error={!!formErrors.routeName}
                  helperText={formErrors.routeName}
                />
                <TextField
                  label="Initial Balance (AED)"
                  value={formData.balance}
                  onChange={handleFormChange('balance')}
                  fullWidth
                  required
                  type="number"
                  error={!!formErrors.balance}
                  helperText={formErrors.balance || 'Enter the initial balance for this driver'}
                  placeholder="150"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained">Add Employee</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={handleFormChange('name')}
              fullWidth
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleFormChange('phoneNumber')}
              fullWidth
              required
              error={!!formErrors.phoneNumber}
              helperText={formErrors.phoneNumber || 'Enter 9 digits (e.g., 552345678). +971 will be added automatically'}
              placeholder="5012345678"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+971</Typography>,
              }}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleFormChange('email')}
              fullWidth
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              placeholder="employee@company.com"
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={handleFormChange('address')}
              fullWidth
              required
              error={!!formErrors.address}
              helperText={formErrors.address}
              placeholder="123 Main Street, Dubai, UAE"
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
            {formData.role === 'driver' && (
              <>
                <TextField
                  label="Location"
                  value={formData.location}
                  onChange={handleFormChange('location')}
                  fullWidth
                  required
                  error={!!formErrors.location}
                  helperText={formErrors.location}
                />
                <TextField
                  label="Route Name"
                  value={formData.routeName}
                  onChange={handleFormChange('routeName')}
                  fullWidth
                  required
                  error={!!formErrors.routeName}
                  helperText={formErrors.routeName}
                />
                <TextField
                  label="Balance (AED)"
                  value={formData.balance}
                  onChange={handleFormChange('balance')}
                  fullWidth
                  required
                  type="number"
                  error={!!formErrors.balance}
                  helperText={formErrors.balance || 'Current balance for this driver'}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Update Employee</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            {`Are you sure you want to delete employee "${selectedEmployee?.name}"? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Balance History Dialog */}
      <Dialog open={balanceHistoryDialogOpen} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>
          Balance History - {selectedEmployee?.name}
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Stack spacing={2}>
              <Typography variant="h6" color="primary.main">
                Current Balance: AED {selectedEmployee.balance?.toFixed(2) || '0.00'}
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Previous Balance</TableCell>
                    <TableCell>Change Amount</TableCell>
                    <TableCell>New Balance</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEmployee.balanceHistory && selectedEmployee.balanceHistory.length > 0 ? (
                    selectedEmployee.balanceHistory
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .map((entry, index) => (
                        <TableRow key={`${entry.version}-${index}`}>
                          <TableCell>
                            {new Date(entry.updatedAt).toLocaleDateString()} {new Date(entry.updatedAt).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>AED {index > 0 ? (selectedEmployee.balanceHistory![index - 1].balance || 0).toFixed(2) : '0.00'}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={(entry.balance || 0) >= (index > 0 ? selectedEmployee.balanceHistory![index - 1].balance || 0 : 0) ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 600 }}
                            >
                              {(entry.balance || 0) >= (index > 0 ? selectedEmployee.balanceHistory![index - 1].balance || 0 : 0) ? '+' : ''}AED {((entry.balance || 0) - (index > 0 ? selectedEmployee.balanceHistory![index - 1].balance || 0 : 0)).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>AED {entry.balance?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {entry.reason?.replace('_', ' ') || 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No balance history available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}


