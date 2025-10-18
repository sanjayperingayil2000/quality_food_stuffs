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
import { Tooltip } from '@mui/material';

export default function Page(): React.JSX.Element {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = React.useState({
    name: '',
    phoneNumber: '',
    role: 'driver' as 'driver' | 'staff',
    location: '',
    routeName: '',
  });

  type FormErrors = {
    name?: string;
    phoneNumber?: string;
    role?: string;
    location?: string;
    routeName?: string;
  };

  // Validation errors
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});

  const handleAddClick = () => {
    setFormData({ name: '', phoneNumber: '', role: 'driver', location: '', routeName: '' });
    setFormErrors({});
    setAddDialogOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      phoneNumber: employee.phoneNumber.replace('+971', '').trim(),
      role: employee.designation === 'ceo' ? 'staff' : employee.designation,
      location: employee.location || '',
      routeName: employee.routeName || '',
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    const newRole = event.target.value as 'driver' | 'staff';
    setFormData(prev => ({ 
      ...prev, 
      role: newRole,
      // Clear location and routeName if staff is selected
      location: newRole === 'staff' ? '' : prev.location,
      routeName: newRole === 'staff' ? '' : prev.routeName,
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

    // Only validate location and routeName if role is driver
    if (formData.role === 'driver') {
      if (!formData.location.trim()) {
        errors.location = 'Location is required for drivers';
      }

      if (!formData.routeName.trim()) {
        errors.routeName = 'Route name is required for drivers';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = () => {
    if (validateForm() && formData.name && formData.phoneNumber) {
      const newEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        designation: formData.role,
        phoneNumber: `+971${formData.phoneNumber}`,
        email: '',
        address: '',
        routeName: formData.role === 'driver' ? formData.routeName : undefined,
        location: formData.role === 'driver' ? formData.location : undefined,
        hireDate: new Date(),
        isActive: true,
      };
      addEmployee(newEmployee);
      setAddDialogOpen(false);
    }
  };

  const handleEditSubmit = () => {
    if (selectedEmployee && validateForm()) {
      updateEmployee(selectedEmployee.id, {
        name: formData.name,
        phoneNumber: `+971${formData.phoneNumber}`,
        designation: formData.role,
        location: formData.role === 'driver' ? formData.location : undefined,
        routeName: formData.role === 'driver' ? formData.routeName : undefined,
      });
      setEditDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedEmployee) {
      deleteEmployee(selectedEmployee.id);
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleCloseDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
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
            <TableCell>Role</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Route name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedEmployees.map((employee) => (
            <TableRow hover key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.phoneNumber}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {employee.designation === 'ceo' ? 'CEO' : employee.designation}
              </TableCell>
              <TableCell>{employee.location || '-'}</TableCell>
              <TableCell>{employee.routeName || '-'}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5}>
                  {employee.designation !== 'ceo' && (
                    <>
                      <Tooltip title="Edit Employee">
                        <IconButton onClick={() => handleEditClick(employee)} size="small">
                          <PencilIcon />
                        </IconButton>
                      </Tooltip>

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
              helperText={formErrors.phoneNumber || 'Enter 10 digits (e.g., 5012345678). +971 will be added automatically'}
              placeholder="5012345678"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+971</Typography>,
              }}
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
              helperText={formErrors.phoneNumber || 'Enter 10 digits (e.g., 5012345678). +971 will be added automatically'}
              placeholder="5012345678"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+971</Typography>,
              }}
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
    </Stack>
  );
}


