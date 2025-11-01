'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
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
import { EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
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

const createUserSchema = (existingUsers: ApiUser[], editingUser: ApiUser | null) => zod.object({
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().min(1, 'Email is required').email('Invalid email format'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string().min(1, 'Confirm Password is required'),
  role: zod.enum(['super_admin', 'manager'], { required_error: 'Role is required' }),
  isActive: zod.boolean(),
}).refine((data) => {
  // Password and confirmPassword must match
  if (data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Check if trying to create/update to super_admin when one already exists
  if (data.role === 'super_admin') {
    const existingSuperAdmins = existingUsers.filter(user => 
      user.roles.includes('super_admin') && user.isActive && user.id !== editingUser?.id
    );
    return existingSuperAdmins.length === 0;
  }
  return true;
}, {
  message: "Only one super admin is allowed",
  path: ["role"],
});

type UserFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'super_admin' | 'manager';
  isActive: boolean;
};


export function UserManagement(): React.JSX.Element {
  const { user: currentUser } = useUser();
  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ApiUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<ApiUser | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(createUserSchema(users, editingUser)),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'manager',
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
      console.log('Fetched users:', result.data?.users);
      setUsers(result.data?.users || []);
    } catch {
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Only fetch when current user is loaded and is super_admin
    if (currentUser?.roles?.includes('super_admin')) {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);

  const handleOpen = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'manager',
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
      confirmPassword: '', // Don't pre-fill confirm password
      role: user.roles[0] as 'super_admin' | 'manager', // Take the first role
      isActive: user.isActive,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    reset();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Check if super admin already exists
  const hasExistingSuperAdmin = React.useMemo(() => {
    return users.some(user => 
      user.roles.includes('super_admin') && user.isActive && user.id !== editingUser?.id
    );
  }, [users, editingUser]);

  const onSubmit = async (data: UserFormData) => {
    try {
      setError(null);

      if (editingUser) {
        // Update existing user
        const updateData: {
          name: string;
          email: string;
          roles: string[];
          isActive: boolean;
          password?: string;
        } = {
          name: data.name,
          email: data.email, // Allow email updates
          roles: [data.role], // Convert single role to array for API
          isActive: data.isActive,
        };

        // Only include password if it's provided
        if (data.password && data.password.trim() !== '') {
          updateData.password = data.password;
        }

        const result = await apiClient.updateUser(editingUser.id, updateData);
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        // Create new user - password is required for new users
        if (!data.password || data.password.trim() === '') {
          setError('Password is required for new users');
          return;
        }
        
        const result = await apiClient.createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          roles: [data.role], // Convert single role to array for API
          isActive: data.isActive,
        });
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
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        setError(null);
        console.log('Attempting to delete user with ID:', userToDelete.id);
        console.log('User ID type:', typeof userToDelete.id);
        const result = await apiClient.deleteUser(userToDelete.id);
        console.log('Delete API result:', result);
        if (result.error) {
          setError(result.error);
          return;
        }
        await fetchUsers();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
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
              {users?.map((user, index) => (
                <TableRow key={user.id || `user-${index}`}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles?.map((role) => (
                      <Chip key={`${user.id || index}-${role}`} label={role} size="small" sx={{ mr: 1 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.isActive}
                          onChange={(e) => handleToggleActive(user.id, e.target.checked)}
                          disabled={user.roles.includes('super_admin') || user.id === currentUser?.id} // Can't deactivate super admin or self
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
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={toggleConfirmPasswordVisibility}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </IconButton>
                      ),
                    }}
                  />
                )}
              />

              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.role)} fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      {...field}
                      label="Role"
                    >
                      <MenuItem value="manager">Manager</MenuItem>
                      <MenuItem 
                        value="super_admin" 
                        disabled={hasExistingSuperAdmin}
                      >
                        Super Admin {hasExistingSuperAdmin ? '(Already exists)' : ''}
                      </MenuItem>
                    </Select>
                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

