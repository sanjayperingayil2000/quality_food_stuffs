'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { apiClient } from '@/lib/api-client';
import { useUser } from '@/hooks/use-user';

// Define the User type that matches the API response
interface ApiUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  settingsAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

const userSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().min(1, 'Email is required').email('Invalid email format'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  roles: zod.array(zod.enum(['super_admin', 'manager'])).min(1, 'At least one role is required'),
  isActive: zod.boolean(),
});

type UserFormData = zod.infer<typeof userSchema>;


export function UserManagement(): React.JSX.Element {
  const { user: currentUser } = useUser();
  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ApiUser | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roles: ['manager'],
      isActive: true,
    },
  });

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getUsers();
      if (result.error) {
        setError(result.error);
        return;
      }
      setUsers(result.data?.users || []);
    } catch {
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpen = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      roles: ['manager'],
      isActive: true,
    });
    setOpen(true);
  };

  const handleEdit = (user: ApiUser) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      roles: user.roles as ('super_admin' | 'manager')[],
      isActive: user.isActive,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setError(null);

      if (editingUser) {
        // Update existing user
        const updateData: Partial<UserFormData> = {
          name: data.name,
          roles: data.roles,
          isActive: data.isActive,
        };

        // Only include password if it's provided
        if (data.password) {
          updateData.password = data.password;
        }

        const result = await apiClient.updateUser(editingUser.id, updateData);
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        // Create new user
        const result = await apiClient.createUser(data);
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      await fetchUsers();
      handleClose();
    } catch {
      setError('Failed to save user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setError(null);
      const result = await apiClient.deleteUser(userId);
      if (result.error) {
        setError(result.error);
        return;
      }
      await fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      setError(null);
      const result = await apiClient.updateUser(userId, { isActive });
      if (result.error) {
        setError(result.error);
        return;
      }
      await fetchUsers();
    } catch {
      setError('Failed to update user');
    }
  };

  // Only show user management for super admin
  if (!currentUser?.roles?.includes('super_admin')) {
    return <></>;
  }

  return (
    <Card>
      <CardHeader
        title="User Management"
        action={
          <Button startIcon={<PlusIcon />} variant="contained" onClick={handleOpen}>
            Add User
          </Button>
        }
      />
      <CardContent>
        {error && <Alert color="error" sx={{ mb: 2 }}>{error}</Alert>}

        {isLoading ? (
          <Typography>Loading users...</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles.map((role) => (
                      <Chip key={`${user.id}-${role}`} label={role} size="small" sx={{ mr: 1 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.isActive}
                          onChange={(e) => handleToggleActive(user.id, e.target.checked)}
                          disabled={user.id === currentUser?.id} // Can't deactivate self
                        />
                      }
                      label={user.isActive ? 'Active' : 'Inactive'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(user)}>
                      <PencilIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUser?.id} // Can't delete self
                    >
                      <TrashIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    fullWidth
                    disabled={!!editingUser} // Don't allow email changes
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="roles"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.roles)} fullWidth>
                    <InputLabel>Roles</InputLabel>
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="Roles" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value,index) => (
                            <Chip key={`${value}-${index}`} label={value} />
                          ))}
                        </Box>
                      )}
                    >
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem value="super_admin">Super Admin</MenuItem>
                    </Select>
                    {errors.roles && <FormHelperText>{errors.roles.message}</FormHelperText>}
                  </FormControl>
                )}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} />}
                    label="Active"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Card>
  );
}

