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
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { useEmployees, Employee } from '@/contexts/employee-context';
import { useNotifications } from '@/contexts/notification-context';
import { Tooltip } from '@mui/material';

export default function Page(): React.JSX.Element {
  const { drivers, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { showSuccess, showError } = useNotifications();

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedDriver, setSelectedDriver] = React.useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = React.useState({
    name: '',
    phoneNumber: '',
    location: '',
    routeName: '',
  });

  type FormErrors = {
    name?: string;
    phoneNumber?: string;
    location?: string;
    routeName?: string;
  };

  // Validation errors
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});


  const handleAddClick = () => {
    setFormData({ name: '', phoneNumber: '', location: '', routeName: '' });
    setFormErrors({ name: '', phoneNumber: '', location: '', routeName: '' });
    setAddDialogOpen(true);
  };

  const handleEditClick = (driver: Employee) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      phoneNumber: driver.phoneNumber,
      location: driver.location || '',
      routeName: driver.routeName || '',
    });
    setFormErrors({ name: '', phoneNumber: '', location: '', routeName: '' });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (driver: Employee) => {
    setSelectedDriver(driver);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{9}$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Phone number must be 9 digits';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!formData.routeName.trim()) {
      errors.routeName = 'Route name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleAddSubmit = async () => {
    if (validateForm() && formData.name && formData.phoneNumber && formData.location && formData.routeName) {
      const newDriver: Employee = {
        id: `EMP-${Date.now()}`,
        name: formData.name,
        designation: 'driver',
        phoneNumber: formData.phoneNumber,
        email: '',
        address: '',
        routeName: formData.routeName,
        location: formData.location,
        hireDate: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        await addEmployee(newDriver);
        showSuccess('Driver added successfully!');
        setAddDialogOpen(false);
      } catch {
        showError('Failed to add driver. Please try again.');
      }
    }
  };

  const handleEditSubmit = async () => {
    if (selectedDriver && validateForm()) {
      try {
        updateEmployee(selectedDriver.id, formData);
        showSuccess('Driver updated successfully!');
        setEditDialogOpen(false);
        setSelectedDriver(null);
      } catch {
        showError('Failed to update driver. Please try again.');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedDriver) {
      try {
        deleteEmployee(selectedDriver.id);
        showSuccess('Driver deleted successfully!');
        setDeleteDialogOpen(false);
        setSelectedDriver(null);
      } catch {
        showError('Failed to delete driver. Please try again.');
      }
    }
  };

  const handleCloseDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedDriver(null);
    setFormErrors({ name: '', phoneNumber: '', location: '', routeName: '' });
  };

  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Drivers</Typography>
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
            <TableCell>Location</TableCell>
            <TableCell>Route name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow hover key={driver.id}>
              <TableCell>{driver.name}</TableCell>
              <TableCell>{driver.phoneNumber}</TableCell>
              <TableCell>{driver.location}</TableCell>
              <TableCell>{driver.routeName}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5}>
                  <Tooltip title="Edit Driver">
                    <IconButton onClick={() => handleEditClick(driver)} size="small">
                      <PencilIcon />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete Driver">
                    <IconButton onClick={() => handleDeleteClick(driver)} size="small" color="error">
                      <TrashIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Driver Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Driver</DialogTitle>
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
              helperText={formErrors.phoneNumber}
            />
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained">Add Driver</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Driver Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Driver</DialogTitle>
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
              helperText={formErrors.phoneNumber}
            />
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Update Driver</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            {`Are you sure you want to delete driver "${selectedDriver?.name}"? This action cannot be undone.`}
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
