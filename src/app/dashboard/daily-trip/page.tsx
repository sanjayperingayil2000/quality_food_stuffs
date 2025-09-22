'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { useProducts } from '@/contexts/products-context';
import { useDrivers } from '@/contexts/drivers-context';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

type Category = 'bakery' | 'fresh';


interface TripProduct {
  productId: string;
  productName: string;
  category: Category;
  quantity: number;
}

interface DailyTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  products: TripProduct[];
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = zod.object({
  driverId: zod.string().min(1, 'Driver selection is required'),
  date: zod.date({ required_error: 'Date is required' }),
  products: zod.array(zod.object({
    productId: zod.string(),
    productName: zod.string(),
    category: zod.enum(['bakery', 'fresh']),
    quantity: zod.number().min(0, 'Quantity must be non-negative'),
  })),
});

type TripFormData = zod.infer<typeof tripSchema>;

// Drivers will be loaded from context

// Products will be loaded from context

const initialTrips: DailyTrip[] = [
  {
    id: 'TRP-001',
    driverId: 'DRV-001',
    driverName: 'Rahul Kumar',
    date: dayjs().subtract(1, 'day').utc().toDate(),
    products: [
      // Bakery items with minimum quantity 1
      { productId: 'PRD-001', productName: 'Sourdough Bread', category: 'bakery', quantity: 3 },
      { productId: 'PRD-002', productName: 'Blueberry Muffin', category: 'bakery', quantity: 2 },
      { productId: 'PRD-003', productName: 'Croissant', category: 'bakery', quantity: 4 },
      { productId: 'PRD-004', productName: 'Whole Wheat Loaf', category: 'bakery', quantity: 2 },
      { productId: 'PRD-005', productName: 'Chocolate Chip Cookie', category: 'bakery', quantity: 6 },
      { productId: 'PRD-006', productName: 'Cinnamon Roll', category: 'bakery', quantity: 3 },
      { productId: 'PRD-007', productName: 'Bagel', category: 'bakery', quantity: 5 },
      { productId: 'PRD-008', productName: 'Danish Pastry', category: 'bakery', quantity: 2 },
      { productId: 'PRD-009', productName: 'Pretzel', category: 'bakery', quantity: 4 },
      { productId: 'PRD-010', productName: 'Donut', category: 'bakery', quantity: 8 },
      { productId: 'PRD-011', productName: 'Baguette', category: 'bakery', quantity: 3 },
      { productId: 'PRD-012', productName: 'Focaccia', category: 'bakery', quantity: 2 },
      // Fresh items with minimum quantity 1
      { productId: 'PRD-013', productName: 'Fresh Apples', category: 'fresh', quantity: 10 },
      { productId: 'PRD-014', productName: 'Bananas', category: 'fresh', quantity: 15 },
      { productId: 'PRD-015', productName: 'Orange Juice', category: 'fresh', quantity: 5 },
      { productId: 'PRD-016', productName: 'Strawberries', category: 'fresh', quantity: 3 },
      { productId: 'PRD-017', productName: 'Grapes', category: 'fresh', quantity: 4 },
      { productId: 'PRD-018', productName: 'Mango', category: 'fresh', quantity: 2 },
      { productId: 'PRD-019', productName: 'Pineapple', category: 'fresh', quantity: 3 },
      { productId: 'PRD-020', productName: 'Watermelon', category: 'fresh', quantity: 1 },
    ],
    createdAt: dayjs().subtract(1, 'day').utc().toDate(),
    updatedAt: dayjs().subtract(1, 'day').utc().toDate(),
  },
];

function generateTripId(): string {
  const count = Math.floor(Math.random() * 1000) + 1;
  return `TRP-${count.toString().padStart(3, '0')}`;
}

export default function Page(): React.JSX.Element {
  const { products } = useProducts();
  const { drivers } = useDrivers();
  const [trips, setTrips] = React.useState<DailyTrip[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editingTrip, setEditingTrip] = React.useState<DailyTrip | null>(null);
  const [filteredTrips, setFilteredTrips] = React.useState<DailyTrip[]>([]);
  const [driverFilter, setDriverFilter] = React.useState<string>('');
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [mounted, setMounted] = React.useState(false);
  const [selectedDriverId, setSelectedDriverId] = React.useState<string>('');

  // Initialize state after component mounts to avoid hydration issues
  React.useEffect(() => {
    setMounted(true);
    setTrips(initialTrips);
    setFilteredTrips(initialTrips);
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      driverId: '',
      date: dayjs().toDate(),
      products: [],
    },
    mode: 'onChange',
  });

  const watchedProducts = watch('products');

  React.useEffect(() => {
    handleApplyFilter();
  }, [handleApplyFilter]);

  const handleOpen = () => {
    setEditingTrip(null);
    setSelectedDriverId('');
    reset({
      driverId: '',
      date: dayjs().toDate(),
      products: [],
    });
    setOpen(true);
  };

  const handleEdit = (trip: DailyTrip) => {
    setEditingTrip(trip);
    setSelectedDriverId(trip.driverId);
    reset({
      driverId: trip.driverId,
      date: trip.date,
      products: trip.products,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTrip(null);
    setSelectedDriverId('');
    reset();
  };

  const handleDelete = (tripId: string) => {
    const updatedTrips = trips.filter(t => t.id !== tripId);
    setTrips(updatedTrips);
    setFilteredTrips(updatedTrips);
  };

  const handleApplyFilter = React.useCallback(() => {
    let filtered = trips;

    // Filter by driver
    if (driverFilter) {
      filtered = filtered.filter(trip => trip.driverId === driverFilter);
    }

    // Filter by date range
    if (dateFrom && dateTo) {
      const fromDate = dayjs(dateFrom).startOf('day').utc();
      const toDate = dayjs(dateTo).endOf('day').utc();

      filtered = filtered.filter(trip => {
        const tripDate = dayjs(trip.date).utc();
        return tripDate.isAfter(fromDate) && tripDate.isBefore(toDate);
      });
    }

    setFilteredTrips(filtered);
  }, [trips, driverFilter, dateFrom, dateTo]);

  const handleProductQuantityChange = (productId: string, quantity: number) => {
    const currentProducts = watchedProducts || [];
    const existingIndex = currentProducts.findIndex(p => p.productId === productId);
    
    if (quantity > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        const updatedProduct = {
          productId: product.id,
          productName: product.name,
          category: product.category,
          quantity,
        };

        if (existingIndex >= 0) {
          const updatedProducts = [...currentProducts];
          updatedProducts[existingIndex] = updatedProduct;
          setValue('products', updatedProducts);
        } else {
          setValue('products', [...currentProducts, updatedProduct]);
        }
      }
    } else {
      if (existingIndex >= 0) {
        const updatedProducts = currentProducts.filter((_, index) => index !== existingIndex);
        setValue('products', updatedProducts);
      }
    }
  };

  const onSubmit = (data: TripFormData) => {
    const driver = drivers.find(d => d.id === data.driverId);
    const filteredProducts = data.products.filter(p => p.quantity > 0);

    if (editingTrip) {
      // Edit existing trip
      const updatedTrips = trips.map(t =>
        t.id === editingTrip.id
          ? {
              ...t,
              driverId: data.driverId,
              driverName: driver?.name || '',
              date: data.date,
              products: filteredProducts,
              updatedAt: dayjs().utc().toDate(),
            }
          : t
      );
      setTrips(updatedTrips);
      setFilteredTrips(updatedTrips);
    } else {
      // Add new trip
      const newTrip: DailyTrip = {
        id: generateTripId(),
        driverId: data.driverId,
        driverName: driver?.name || '',
        date: data.date,
        products: filteredProducts,
        createdAt: dayjs().utc().toDate(),
        updatedAt: dayjs().utc().toDate(),
      };
      const updatedTrips = [...trips, newTrip];
      setTrips(updatedTrips);
      setFilteredTrips(updatedTrips);
    }
    handleClose();
  };

  const bakeryProducts = products.filter(p => p.category === 'bakery');
  const freshProducts = products.filter(p => p.category === 'fresh');

  // Products are loaded from context

  // Drivers are loaded from the drivers array

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Daily Trip</Typography>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpen}>
            Add Trip
          </Button>
        </div>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Driver</InputLabel>
          <Select
            value={driverFilter}
            label="Driver"
            onChange={(e) => setDriverFilter(e.target.value)}
          >
            <MenuItem value="">All Drivers</MenuItem>
            {drivers.map((driver) => (
              <MenuItem key={driver.id} value={driver.id}>
                {driver.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <Button variant="outlined" onClick={handleApplyFilter}>
          Apply
        </Button>
      </Stack>

      <Stack spacing={2}>
        {filteredTrips.map((trip) => (
          <Card key={trip.id} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                {trip.driverName} - {dayjs(trip.date).tz('Asia/Dubai').format('MMM D, YYYY')} GST
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => handleEdit(trip)} size="small">
                  <PencilIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(trip.id)} size="small" color="error">
                  <TrashIcon />
                </IconButton>
              </Stack>
            </Stack>
            <Grid container spacing={2}>
              {trip.products.map((product) => (
                <Grid
                  key={product.productId}
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                >
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {product.productId}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {product.productName}
                    </Typography>
                    <Chip
                      label={product.category === 'bakery' ? 'Bakery' : 'Fresh'}
                      size="small"
                      color={product.category === 'bakery' ? 'primary' : 'success'}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Quantity: {product.quantity}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        ))}
      </Stack>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        BackdropProps={{
          sx: { zIndex: 1600 }
        }}
        sx={{
          zIndex: 1700,
          '& .MuiDialog-paper': {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1700,
            maxHeight: '90vh',
            overflow: 'auto',
            margin: 0,
          }
        }}
      >
        <DialogTitle>{editingTrip ? 'Edit Trip' : 'Add Trip'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box sx={{ width: '100%' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: errors.driverId ? 'error.main' : 'text.secondary',
                    mb: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Driver * (Select from list below)
                </Typography>
                
                {/* Test driver selection - clickable cards */}
                <Box sx={{ 
                  border: `1px solid ${errors.driverId ? '#d32f2f' : '#c4c4c4'}`,
                  borderRadius: 1,
                  p: 1,
                  minHeight: '56px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'center'
                }}>
                  {selectedDriverId ? (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}>
                      <span>
                        {drivers.find(d => d.id === selectedDriverId)?.name} - {drivers.find(d => d.id === selectedDriverId)?.routeName}
                      </span>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedDriverId('');
                          setValue('driverId', '');
                        }}
                        sx={{ 
                          minWidth: 'auto', 
                          p: 0.5, 
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                        }}
                      >
                        ✕
                      </Button>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Click on a driver below to select
                    </Typography>
                  )}
                </Box>
                
                {/* Driver selection cards */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                    Available Drivers:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {drivers.map((driver) => (
                      <Box 
                        key={driver.id} 
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer', 
                          border: selectedDriverId === driver.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                          borderRadius: 1,
                          bgcolor: selectedDriverId === driver.id ? 'rgba(25, 118, 210, 0.1)' : 'white',
                          '&:hover': { 
                            bgcolor: selectedDriverId === driver.id ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0,0,0,0.04)',
                            borderColor: selectedDriverId === driver.id ? '#1976d2' : '#bdbdbd'
                          },
                          transition: 'all 0.2s ease',
                          minWidth: '200px'
                        }}
                        onClick={() => {
                          setSelectedDriverId(driver.id);
                          setValue('driverId', driver.id);
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {driver.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {driver.routeName}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {driver.location}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                
                {errors.driverId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.driverId.message}
                  </Typography>
                )}
              </Box>
              

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Date"
                      format="MMM D, YYYY"
                      value={dayjs(field.value)}
                      onChange={(newValue) => field.onChange(newValue?.toDate())}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: Boolean(errors.date),
                          helperText: errors.date?.message,
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>

              <Typography variant="h6">Select Products</Typography>
              
              
              <Grid container spacing={3}>
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Bakery Items ({bakeryProducts.length})
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                    <Stack spacing={2}>
                      {bakeryProducts.map((product) => (
                        <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {product.id}
                            </Typography>
                            <Typography variant="body1">
                              {product.name}
                            </Typography>
                          </Box>
                          <TextField
                            type="number"
                            label="Qty"
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 0 }}
                            value={watchedProducts?.find(p => p.productId === product.id)?.quantity || 0}
                            onChange={(e) => handleProductQuantityChange(product.id, Number.parseInt(e.target.value) || 0)}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
                
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Fresh Items ({freshProducts.length})
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                    <Stack spacing={2}>
                      {freshProducts.map((product) => (
                        <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {product.id}
                            </Typography>
                            <Typography variant="body1">
                              {product.name}
                            </Typography>
                          </Box>
                          <TextField
                            type="number"
                            label="Qty"
                            size="small"
                            sx={{ width: 80 }}
                            inputProps={{ min: 0 }}
                            value={watchedProducts?.find(p => p.productId === product.id)?.quantity || 0}
                            onChange={(e) => handleProductQuantityChange(product.id, Number.parseInt(e.target.value) || 0)}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
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
