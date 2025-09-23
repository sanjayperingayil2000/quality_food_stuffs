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

import { useDrivers, Driver } from '@/contexts/drivers-context';

export default function Page(): React.JSX.Element {
  const { drivers, addDriver, updateDriver, deleteDriver } = useDrivers();
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedDriver, setSelectedDriver] = React.useState<Driver | null>(null);
  
  // Form states
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    location: '',
    routeName: '',
    description: ''
  });

  const handleAddClick = () => {
    setFormData({ name: '', phone: '', location: '', routeName: '', description: '' });
    setAddDialogOpen(true);
  };

  const handleEditClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      location: driver.location,
      routeName: driver.routeName,
      description: driver.description || ''
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setDeleteDialogOpen(true);
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleAddSubmit = () => {
    if (formData.name && formData.phone && formData.location && formData.routeName) {
      const newDriver: Driver = {
        id: `DRV-${Date.now()}`,
        ...formData
      };
      addDriver(newDriver);
      setAddDialogOpen(false);
    }
  };

  const handleEditSubmit = () => {
    if (selectedDriver && formData.name && formData.phone && formData.location && formData.routeName) {
      updateDriver(selectedDriver.id, formData);
      setEditDialogOpen(false);
      setSelectedDriver(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedDriver) {
      deleteDriver(selectedDriver.id);
      setDeleteDialogOpen(false);
      setSelectedDriver(null);
    }
  };

  const handleCloseDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedDriver(null);
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
              <TableCell>{driver.phone}</TableCell>
              <TableCell>{driver.location}</TableCell>
              <TableCell>{driver.routeName}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5}>
                  <IconButton onClick={() => handleEditClick(driver)} size="small">
                    <PencilIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(driver)} size="small" color="error">
                    <TrashIcon />
                  </IconButton>
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
            />
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={handleFormChange('phone')}
              fullWidth
              required
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={handleFormChange('location')}
              fullWidth
              required
            />
            <TextField
              label="Route Name"
              value={formData.routeName}
              onChange={handleFormChange('routeName')}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleFormChange('description')}
              fullWidth
              multiline
              rows={3}
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
            />
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={handleFormChange('phone')}
              fullWidth
              required
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={handleFormChange('location')}
              fullWidth
              required
            />
            <TextField
              label="Route Name"
              value={formData.routeName}
              onChange={handleFormChange('routeName')}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleFormChange('description')}
              fullWidth
              multiline
              rows={3}
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
            Are you sure you want to delete driver "{selectedDriver?.name}"? This action cannot be undone.
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




