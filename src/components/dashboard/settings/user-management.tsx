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
import InputAdornment from '@mui/material/InputAdornment';
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
import { CopySimple } from '@phosphor-icons/react/dist/ssr/CopySimple';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { apiClient } from '@/lib/api-client';
import { useUser } from '@/hooks/use-user';
import { useEmployees } from '@/contexts/employee-context';

// Define the User type that matches the API response
interface ApiUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  settingsAccess?: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  state?: string;
  city?: string;
  profilePhoto?: string | null;
  mustChangePassword?: boolean;
  employeeId?: string;
}

const createUserSchema = (existingUsers: ApiUser[], editingUser: ApiUser | null) => zod.object({
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().min(1, 'Email is required').email('Invalid email format'),
  password: zod.string(),
  confirmPassword: zod.string(),
  role: zod.enum(['super_admin', 'manager', 'driver'], { required_error: 'Role is required' }),
  isActive: zod.boolean(),
}).superRefine((data, ctx) => {
  const password = data.password.trim();
  const confirmPassword = data.confirmPassword.trim();
  const wantsPasswordChange = password.length > 0 || confirmPassword.length > 0;

  if (wantsPasswordChange) {
    if (password.length < 6) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password must be at least 6 characters',
      });
    }
    if (confirmPassword.length === 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Confirm Password is required',
      });
    } else if (password !== confirmPassword) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: "Passwords don't match",
      });
    }
  }

  if (data.role === 'super_admin') {
    const existingSuperAdmins = existingUsers.filter(user =>
      user.roles.includes('super_admin') && user.isActive && user.id !== editingUser?.id
    );
    if (existingSuperAdmins.length > 0) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ['role'],
        message: 'Only one super admin is allowed',
      });
    }
  }
});

type UserFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'super_admin' | 'manager' | 'driver';
  employeeId?: string;
  isActive: boolean;
};

const getDefaultFormValues = (currentUserRole?: string): UserFormData => ({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: currentUserRole === 'manager' ? 'driver' : 'manager',
  employeeId: '',
  isActive: true,
});


export function UserManagement(): React.JSX.Element {
  const { user: currentUser } = useUser();
  const { employees } = useEmployees();
  const [users, setUsers] = React.useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ApiUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<ApiUser | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [generatedPassword, setGeneratedPassword] = React.useState<string | null>(null);
  const isEditing = Boolean(editingUser);
  
  // Define role checks early so they can be used throughout the component
  const isSuperAdmin = currentUser?.roles?.includes('super_admin');
  const isManager = currentUser?.roles?.includes('manager');
  
  const handleCopyGeneratedPassword = React.useCallback(async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
    } catch {
      setError('Unable to copy the password. Please copy it manually.');
    }
  }, [generatedPassword]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(createUserSchema(users, editingUser)),
    defaultValues: getDefaultFormValues(currentUser?.roles?.[0]),
  });
  
  const role = watch('role');
  
  // Filter employees based on role - managers for manager role, drivers for driver role
  const availableEmployees = React.useMemo(() => {
    if (!role || role === 'super_admin') return [];
    return employees.filter(emp => {
      if (role === 'manager') {
        // For manager role, show CEO and staff (since there's no manager designation in employees)
        return emp.designation === 'ceo' || emp.designation === 'staff';
      }
      if (role === 'driver') {
        return emp.designation === 'driver';
      }
      return false;
    }).filter(emp => {
      // Include current employee if editing, or filter out employees that already have a login account
      const isCurrentEmployee = editingUser && (editingUser as ApiUser & { employeeId?: string }).employeeId === emp.id;
      return isCurrentEmployee || !users.some(user => user.employeeId === emp.id && user.isActive && user.id !== editingUser?.id);
    });
  }, [role, employees, users, editingUser]);

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getUsers();
      if (result.error) {
        setError(result.error);
        return;
      }
      const normalizedUsers = (result.data?.users || [])
        .map((user: Partial<ApiUser> & { _id?: string }) => {
          const normalizedId = (user.id ?? user._id ?? '').toString();
          return {
            ...user,
            id: normalizedId,
            roles: user.roles ?? [],
          } as ApiUser;
        })
        .filter((user): user is ApiUser => Boolean(user.id));
      
      // If user is a Manager (not SuperAdmin), filter to show only drivers
      const currentIsManager = currentUser?.roles?.includes('manager');
      const currentIsSuperAdmin = currentUser?.roles?.includes('super_admin');
      const isManagerOnly = currentIsManager && !currentIsSuperAdmin;
      const filteredUsers = isManagerOnly
        ? normalizedUsers.filter((user) => user.roles.includes('driver'))
        : normalizedUsers;
      
      setUsers(filteredUsers);
    } catch {
      setError('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    // Only fetch when current user is loaded, has access (super_admin or manager), and does not need to change password
    if ((currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('manager')) && !currentUser.mustChangePassword) {
      fetchUsers();
    }
  }, [fetchUsers, currentUser]);

  const handleOpen = () => {
    setEditingUser(null);
    setError(null);
    setGeneratedPassword(null);
    reset(getDefaultFormValues(currentUser?.roles?.[0]));
    setOpen(true);
  };

  const handleEdit = (user: ApiUser) => {
    setEditingUser(user);
    setGeneratedPassword(null);
    const userEmployeeId = (user as ApiUser & { employeeId?: string }).employeeId || '';
    reset({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      confirmPassword: '', // Don't pre-fill confirm password
      role: user.roles[0] as 'super_admin' | 'manager' | 'driver', // Take the first role
      employeeId: userEmployeeId,
      isActive: user.isActive,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setGeneratedPassword(null);
    reset(getDefaultFormValues(currentUser?.roles?.[0]));
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
      const trimmedPassword = data.password.trim();

      // If manager is creating/editing, ensure they can only create/edit drivers
      if (isManager && !isSuperAdmin && data.role !== 'driver') {
        setError('Managers can only create or edit drivers');
        return;
      }

      if (editingUser) {
        // Update existing user
        const updateData: {
          name: string;
          email: string;
          roles: string[];
          isActive: boolean;
          password?: string;
          mustChangePassword?: boolean;
          employeeId?: string;
        } = {
          name: data.name,
          email: data.email, // Allow email updates
          roles: [data.role], // Convert single role to array for API
          isActive: data.isActive,
        };

        // Only include password if it's provided
        if (trimmedPassword !== '') {
          updateData.password = trimmedPassword;
          updateData.mustChangePassword = true;
        }
        
        // Add employeeId if role is manager or driver
        updateData.employeeId = data.role === 'super_admin' ? undefined : (data.employeeId || undefined);

        const result = await apiClient.updateUser(editingUser.id, updateData);
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const payload: { name: string; email: string; roles: string[]; isActive: boolean; password?: string; employeeId?: string } = {
          name: data.name,
          email: data.email,
          roles: [data.role], // Convert single role to array for API
          isActive: data.isActive,
        };

        if (trimmedPassword !== '') {
          payload.password = trimmedPassword;
        }
        
        // Add employeeId if role is manager or driver
        if (data.role !== 'super_admin' && data.employeeId) {
          payload.employeeId = data.employeeId;
        }
        
        const result = await apiClient.createUser(payload);
        if (result.error) {
          setError(result.error);
          return;
        }
        const defaultPassword = result.data?.defaultPassword ?? null;
        setGeneratedPassword(defaultPassword);
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
      if (!userId) {
        setError('Unable to update user status: missing user identifier.');
        return;
      }
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

  // Only show user management for super admin or manager
  if (!isSuperAdmin && !isManager) {
    return <></>;
  }

  if (currentUser?.mustChangePassword) {
    return (
      <Alert severity="info">
        Please update your password before managing user accounts.
      </Alert>
    );
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
        {generatedPassword && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Typography>
                A default password was generated for the new user:{' '}
                <strong>{generatedPassword}</strong>
              </Typography>
              <Button
                size="small"
                startIcon={<CopySimple width={16} height={16} />}
                onClick={handleCopyGeneratedPassword}
              >
                Copy
              </Button>
            </Stack>
          </Alert>
        )}
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
                    <IconButton 
                      onClick={() => handleEdit(user)}
                      disabled={
                        // Managers can only edit drivers, not other managers
                        isManager && !isSuperAdmin && user.roles.includes('manager')
                      }
                    >
                      <PencilIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(user.id)}
                      disabled={
                        user.id === currentUser?.id || // Can't delete self
                        // Managers can only delete drivers, not other managers
                        (isManager && !isSuperAdmin && user.roles.includes('manager'))
                      }
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
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
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
                  autoComplete="off"
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
                    autoComplete={isEditing ? 'email' : 'off'}
                  />
                )}
              />

              {!isEditing && (
                <Alert severity="info">
                  A secure password will be generated automatically and shown after the user is created.
                </Alert>
              )}

              {isEditing && (
                <>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        error={Boolean(errors.password)}
                        helperText={errors.password?.message}
                        fullWidth
                        autoComplete="new-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={togglePasswordVisibility}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                              </IconButton>
                            </InputAdornment>
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
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        error={Boolean(errors.confirmPassword)}
                        helperText={errors.confirmPassword?.message}
                        fullWidth
                        autoComplete="new-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={toggleConfirmPasswordVisibility}
                                edge="end"
                                size="small"
                              >
                                {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </>
              )}

              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <FormControl error={Boolean(errors.role)} fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      {...field}
                      label="Role"
                      disabled={
                        (isManager && !isSuperAdmin) // Managers can only create/edit drivers, role field is disabled
                      }
                      onChange={(e) => {
                        field.onChange(e);
                        // Reset employeeId when role changes
                        reset({ ...watch(), employeeId: '', role: e.target.value as 'super_admin' | 'manager' | 'driver' });
                      }}
                    >
                      {isSuperAdmin && (
                        <MenuItem value="manager">Manager</MenuItem>
                      )}
                      {isSuperAdmin && (
                        <MenuItem 
                          value="super_admin" 
                          disabled={hasExistingSuperAdmin}
                        >
                          Super Admin {hasExistingSuperAdmin ? '(Already exists)' : ''}
                        </MenuItem>
                      )}
                      <MenuItem value="driver">Driver</MenuItem>
                    </Select>
                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                    {isManager && !isSuperAdmin && (
                      <FormHelperText>Managers can only create and edit drivers</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Employee dropdown - only show for manager and driver roles */}
              {role && role !== 'super_admin' && (
                <Controller
                  control={control}
                  name="employeeId"
                  render={({ field }) => {
                    const selectedEmployee = employees.find(emp => emp.id === field.value);
                    return (
                      <FormControl error={Boolean(errors.employeeId)} fullWidth>
                        <InputLabel>Select {role === 'manager' ? 'Manager' : 'Driver'}</InputLabel>
                        <Select
                          {...field}
                          label={`Select ${role === 'manager' ? 'Manager' : 'Driver'}`}
                          disabled={availableEmployees.length === 0}
                        >
                          {availableEmployees.length === 0 ? (
                            <MenuItem value="" disabled>
                              {role === 'manager' 
                                ? 'No available managers (all have login accounts)' 
                                : 'No available drivers (all have login accounts)'}
                            </MenuItem>
                          ) : (
                            availableEmployees.map((emp) => (
                              <MenuItem key={emp.id} value={emp.id}>
                                {emp.name} {emp.routeName ? `(${emp.routeName})` : ''}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                        {errors.employeeId && <FormHelperText>{errors.employeeId.message}</FormHelperText>}
                        {selectedEmployee && editingUser && (
                          <FormHelperText>
                            Current: {selectedEmployee.name} {selectedEmployee.routeName ? `(${selectedEmployee.routeName})` : ''}
                          </FormHelperText>
                        )}
                        {availableEmployees.length === 0 && !selectedEmployee && (
                          <FormHelperText>
                            {role === 'manager' 
                              ? 'All managers already have login accounts' 
                              : 'All drivers already have login accounts'}
                          </FormHelperText>
                        )}
                      </FormControl>
                    );
                  }}
                />
              )}

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

