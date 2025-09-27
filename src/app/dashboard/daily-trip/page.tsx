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

import { useProducts } from '@/contexts/product-context';
import { useEmployees } from '@/contexts/employee-context';
import { useDailyTrips } from '@/contexts/daily-trip-context';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

type Category = 'bakery' | 'fresh';
type TransferType = 'no_transfer' | 'product_transferred' | 'product_accepted';

interface TripProduct {
  productId: string;
  productName: string;
  category: Category;
  quantity: number;
  unitPrice: number;
}

interface ProductTransfer {
  type: TransferType;
  fromDriverId?: string;
  toDriverId?: string;
  products: TripProduct[];
}

interface DailyTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  transfer: ProductTransfer;
  // Financial fields
  collectionAmount: number;
  purchaseAmount: number;
  expiry: number; // Days until expiry
  discount: number; // Discount percentage
  // Calculated totals
  totalAmount: number;
  netTotal: number;
  grandTotal: number;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this trip
  updatedBy?: string; // Employee ID who last updated this trip
}

const tripSchema = zod.object({
  driverId: zod.string().min(1, 'Driver selection is required'),
  date: zod.date({ required_error: 'Date is required' }),
  transferType: zod.enum(['no_transfer', 'product_transferred', 'product_accepted']),
  fromDriverId: zod.string().optional(),
  toDriverId: zod.string().optional(),
  selectedCategory: zod.enum(['bakery', 'fresh']).optional(),
  products: zod.array(zod.object({
    productId: zod.string(),
    productName: zod.string(),
    category: zod.enum(['bakery', 'fresh']),
    quantity: zod.number().min(0, 'Quantity must be non-negative'),
    unitPrice: zod.number().min(0, 'Unit price must be non-negative'),
  })),
  collectionAmount: zod.number().min(0, 'Collection amount must be non-negative'),
  purchaseAmount: zod.number().min(0, 'Purchase amount must be non-negative'),
  expiry: zod.number().min(0, 'Expiry amount must be non-negative'),
  discount: zod.number().min(0, 'Discount amount must be non-negative'),
});

type TripFormData = zod.infer<typeof tripSchema>;

// Calculation functions
const calculateTotals = (products: TripProduct[]) => {
  const freshProducts = products.filter(p => p.category === 'fresh');
  const bakeryProducts = products.filter(p => p.category === 'bakery');

  const freshTotal = freshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const bakeryTotal = bakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  const freshNetTotal = freshTotal * (1 - 0.115); // 11.5% reduction
  const bakeryNetTotal = bakeryTotal * (1 - 0.16); // 16% reduction

  const freshGrandTotal = freshNetTotal * 1.05; // 5% addition
  const bakeryGrandTotal = bakeryNetTotal * 1.05; // 5% addition

  return {
    fresh: { total: freshTotal, netTotal: freshNetTotal, grandTotal: freshGrandTotal },
    bakery: { total: bakeryTotal, netTotal: bakeryNetTotal, grandTotal: bakeryGrandTotal },
  };
};

// Data will be loaded from contexts

function _generateTripId(): string {
  const _count = Math.floor(Math.random() * 1000) + 1;
  return `TRP-AED ${_count.toString().padStart(3, '0')}`;
}

export default function Page(): React.JSX.Element {
  const { products } = useProducts();
  const { drivers } = useEmployees();
  const { trips, addTrip, updateTrip, deleteTrip } = useDailyTrips();
  const [open, setOpen] = React.useState(false);
  const [editingTrip, setEditingTrip] = React.useState<DailyTrip | null>(null);
  const [filteredTrips, setFilteredTrips] = React.useState<DailyTrip[]>([]);
  const [driverFilter, setDriverFilter] = React.useState<string>('');
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [mounted, setMounted] = React.useState(false);
  const [selectedDriverId, setSelectedDriverId] = React.useState<string>('');
  const [transferType, setTransferType] = React.useState<string>('no_transfer');

  // Initialize state after component mounts to avoid hydration issues
  React.useEffect(() => {
    setMounted(true);
    setFilteredTrips(trips);
  }, [trips]);

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
      transferType: 'no_transfer',
      fromDriverId: '',
      toDriverId: '',
      selectedCategory: 'bakery',
      products: [],
      collectionAmount: 0,
      purchaseAmount: 0,
      expiry: 0,
      discount: 0,
    },
    mode: 'onChange',
  });

  const watchedProducts = watch('products');
  const watchedTransferType = watch('transferType');
  const watchedSelectedCategory = watch('selectedCategory');

  // Debug logging
  React.useEffect(() => {
    console.log('Current transfer type:', watchedTransferType);
    console.log('Current selected category:', watchedSelectedCategory);
  }, [watchedTransferType, watchedSelectedCategory]);

  // Calculation functions

  const handleOpen = () => {
    setEditingTrip(null);
    setSelectedDriverId('');
    setTransferType('no_transfer');
    reset({
      driverId: '',
      date: dayjs().toDate(),
      transferType: 'no_transfer',
      fromDriverId: '',
      toDriverId: '',
      selectedCategory: 'bakery',
      products: [],
    });
    setOpen(true);
  };

  const handleEdit = (trip: DailyTrip) => {
    setEditingTrip(trip);
    setSelectedDriverId(trip.driverId);
    setTransferType(trip.transfer.type);
    reset({
      driverId: trip.driverId,
      date: trip.date,
      transferType: trip.transfer.type,
      fromDriverId: trip.transfer.fromDriverId || '',
      toDriverId: trip.transfer.toDriverId || '',
      selectedCategory: 'bakery',
      products: trip.transfer.products,
      collectionAmount: trip.collectionAmount,
      purchaseAmount: trip.purchaseAmount,
      expiry: trip.expiry,
      discount: trip.discount,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTrip(null);
    setSelectedDriverId('');
    setTransferType('no_transfer');
    reset();
  };

  const handleDelete = (tripId: string) => {
    deleteTrip(tripId);
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

  // Apply filter when dependencies change
  React.useEffect(() => {
    handleApplyFilter();
  }, [handleApplyFilter]);

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
          unitPrice: product.price,
        };

        if (existingIndex == -1) {
          setValue('products', [...currentProducts, updatedProduct]);
        } else {
          const updatedProducts = [...currentProducts];
          updatedProducts[existingIndex] = updatedProduct;
          setValue('products', updatedProducts);
        }
      }
    } else {
      if (existingIndex !== -1) {
        const updatedProducts = currentProducts.filter((_, index) => index !== existingIndex);
        setValue('products', updatedProducts);
      }
    }
  };

  const onSubmit = (data: TripFormData) => {
    const driver = drivers.find(d => d.id === data.driverId);
    const filteredProducts = data.products.filter(p => p.quantity > 0);

    const transfer: ProductTransfer = {
      type: data.transferType,
      fromDriverId: data.fromDriverId,
      toDriverId: data.toDriverId,
      products: filteredProducts,
    };

    const tripData = {
      driverId: data.driverId,
      driverName: driver?.name || '',
      date: data.date,
      transfer,
      collectionAmount: data.collectionAmount,
      purchaseAmount: data.purchaseAmount,
      expiry: data.expiry,
      discount: data.discount,
      totalAmount: 0, // Will be calculated in context
      netTotal: 0, // Will be calculated in context
      grandTotal: 0, // Will be calculated in context
    };

    if (editingTrip) {
      updateTrip(editingTrip.id, tripData);
    } else {
      addTrip(tripData);
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
            <Stack spacing={2}>
              {trip.transfer.type !== 'no_transfer' && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Transfer Type: {trip.transfer.type === 'product_transferred' ? 'Product Transferred' : 'Product Accepted'}
                  </Typography>
                  
                  <Stack direction="row" spacing={2}>
                    {trip.transfer.fromDriverId && (
                      <Typography variant="body2">
                        From: {drivers.find(d => d.id === trip.transfer.fromDriverId)?.name}
                      </Typography>
                    )}
                    {trip.transfer.toDriverId && (
                      <Typography variant="body2">
                        To: {drivers.find(d => d.id === trip.transfer.toDriverId)?.name}
                      </Typography>
                    )}
                  </Stack>
                </>
              )}

              <Grid container spacing={2}>
                {trip.transfer.products.map((product) => (
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
                        Quantity: {product.quantity} × AED {product.unitPrice} = AED {(product.quantity * product.unitPrice).toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Financial Information Display */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Financial Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">Collection Amount</Typography>
                    <Typography variant="h6" color="success.main">AED {trip.collectionAmount.toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">Purchase Amount</Typography>
                    <Typography variant="h6" color="primary.main">AED {trip.purchaseAmount.toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">Expiry Amount</Typography>
                    <Typography variant="h6" color="warning.main">AED {trip.expiry.toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">Discount Amount</Typography>
                    <Typography variant="h6" color="warning.main">AED {trip.discount.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {trip.transfer.products.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Product Calculations</Typography>
                  {(() => {
                    const totals = calculateTotals(trip.transfer.products);
                    return (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>Fresh Items</Typography>
                          <Typography variant="body2">Total: AED {totals.fresh.total.toFixed(2)}</Typography>
                          <Typography variant="body2">Net Total: AED {totals.fresh.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.fresh.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>Bakery Items</Typography>
                          <Typography variant="body2">Total: AED {totals.bakery.total.toFixed(2)}</Typography>
                          <Typography variant="body2">Net Total: AED {totals.bakery.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.bakery.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1, borderTop: 1, borderColor: 'divider', pt: 1 }}>Overall Totals</Typography>
                          <Typography variant="body2">Total Amount: AED {trip.totalAmount.toFixed(2)}</Typography>
                          <Typography variant="body2">Net Total: AED {trip.netTotal.toFixed(2)}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>Grand Total: AED {trip.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </Paper>
              )}
            </Stack>
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
                  border: `1px solid AED {errors.driverId ? '#d32f2f' : '#c4c4c4'}`,
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

              {/* Transfer Type Selection */}
              <FormControl fullWidth error={Boolean(errors.transferType)}>
                <InputLabel>Transfer Type</InputLabel>
                <Select
                  value={transferType}
                  label="Transfer Type"
                  onChange={(e) => {
                    console.log('Transfer type changed to:', e.target.value);
                    setTransferType(e.target.value);
                    setValue('transferType', e.target.value as 'no_transfer' | 'product_transferred' | 'product_accepted');
                    // Reset dependent fields when transfer type changes
    setValue('fromDriverId', '');
    setValue('toDriverId', '');
    setValue('selectedCategory', 'bakery');
    setValue('products', []);
    setValue('collectionAmount', 0);
    setValue('purchaseAmount', 0);
    setValue('expiry', 0);
    setValue('discount', 0);
                    setValue('collectionAmount', 0);
                    setValue('purchaseAmount', 0);
                    setValue('expiry', 0);
                    setValue('discount', 0);
                  }}
                >
                  <MenuItem value="no_transfer">No Product Transferred</MenuItem>
                  <MenuItem value="product_transferred">Product Transferred</MenuItem>
                  <MenuItem value="product_accepted">Product Accepted</MenuItem>
                </Select>
                {errors.transferType && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.transferType.message}
                  </Typography>
                )}
              </FormControl>

              {/* Driver Selection for Transfer/Acceptance */}
              {transferType !== 'no_transfer' && (
                <FormControl fullWidth error={Boolean(errors.fromDriverId || errors.toDriverId)}>
                  <InputLabel>
                    {transferType === 'product_transferred' ? 'Transfer To Driver' : 'Accept From Driver'}
                  </InputLabel>
                  <Select
                    value={transferType === 'product_transferred' ? watch('toDriverId') || '' : watch('fromDriverId') || ''}
                    label={transferType === 'product_transferred' ? 'Transfer To Driver' : 'Accept From Driver'}
                    onChange={(e) => {
                      if (transferType === 'product_transferred') {
                        setValue('toDriverId', e.target.value);
                      } else {
                        setValue('fromDriverId', e.target.value);
                      }
                    }}
                  >
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.name} - {driver.routeName}
                      </MenuItem>
                    ))}
                  </Select>
                  {(errors.fromDriverId || errors.toDriverId) && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {(errors.fromDriverId || errors.toDriverId)?.message}
                    </Typography>
                  )}
                </FormControl>
              )}

              {/* Product Selection - Different based on transfer type */}
              {transferType === 'no_transfer' ? (
                // Normal product selection for no transfer
                <>
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
                                <Typography variant="body2" color="text.secondary">
                                  AED {product.price} per unit
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
                                <Typography variant="body2" color="text.secondary">
                                  AED {product.price} per unit
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
                </>
              ) : (
                // Transfer-specific product selection
                <Stack spacing={3}>
                  {/* Category Selection for Transfer */}
                  <FormControl fullWidth error={Boolean(errors.selectedCategory)}>
                    <InputLabel>Product Category</InputLabel>
                    <Select
                      value={watchedSelectedCategory || 'bakery'}
                      label="Product Category"
                      onChange={(e) => {
                        setValue('selectedCategory', e.target.value as 'bakery' | 'fresh');
                        // Reset products when category changes
                        setValue('products', []);
                      }}
                    >
                      <MenuItem value="bakery">Bakery</MenuItem>
                      <MenuItem value="fresh">Fresh</MenuItem>
                    </Select>
                    {errors.selectedCategory && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.selectedCategory.message}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Product Selection based on category */}
                  {watchedSelectedCategory && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Select Products - {watchedSelectedCategory === 'bakery' ? 'Bakery' : 'Fresh'} Items
                      </Typography>
                      <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                        <Stack spacing={2}>
                          {products
                            .filter(p => p.category === watchedSelectedCategory)
                            .map((product) => (
                              <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {product.id}
                                  </Typography>
                                  <Typography variant="body1">
                                    {product.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    AED {product.price} per unit
                                  </Typography>
                                </Box>
                                <TextField
                                  type="number"
                                  label="Qty"
                                  size="small"
                                  sx={{ width: 100 }}
                                  inputProps={{ min: 0 }}
                                  value={watchedProducts?.find(p => p.productId === product.id)?.quantity || 0}
                                  onChange={(e) => handleProductQuantityChange(product.id, Number.parseInt(e.target.value) || 0)}
                                />
                              </Box>
                            ))}
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Financial Information */}
              <Typography variant="h6" sx={{ mb: 2 }}>Financial Information</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="collectionAmount"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Collection Amount (AED)"
                        type="number"
                        fullWidth
                        error={Boolean(errors.collectionAmount)}
                        helperText={errors.collectionAmount?.message}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="purchaseAmount"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Purchase Amount (AED)"
                        type="number"
                        fullWidth
                        error={Boolean(errors.purchaseAmount)}
                        helperText={errors.purchaseAmount?.message}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="expiry"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Expiry Amount (AED)"
                        type="number"
                        fullWidth
                        error={Boolean(errors.expiry)}
                        helperText={errors.expiry?.message}
                        inputProps={{ min: 0, step: 1 }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="discount"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Discount Amount (AED)"
                        type="number"
                        fullWidth
                        error={Boolean(errors.discount)}
                        helperText={errors.discount?.message}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Display Calculations */}
              {watchedProducts && watchedProducts.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Calculations</Typography>
                  {(() => {
                    const totals = calculateTotals(watchedProducts);
                    return (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>Fresh Items</Typography>
                          <Typography variant="body2">Total: AED {totals.fresh.total.toFixed(2)}</Typography>
                          <Typography variant="body2">Net Total: AED {totals.fresh.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.fresh.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>Bakery Items</Typography>
                          <Typography variant="body2">Total: AED {totals.bakery.total.toFixed(2)}</Typography>
                          <Typography variant="body2">Net Total: AED {totals.bakery.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.bakery.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </Paper>
              )}
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
