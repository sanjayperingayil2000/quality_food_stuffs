'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
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
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
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
import { useDailyTrips, ProductTransfer } from '@/contexts/daily-trip-context';
import { useNotifications } from '@/contexts/notification-context';
import type { DailyTrip, TripProduct } from '@/contexts/daily-trip-context';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Utility function to round balance values
const roundBalance = (value: number): number => {
  return Math.round(value);
};

// type Category = 'bakery' | 'fresh'; // Removed as it's defined in context

const tripSchema = zod.object({
  driverId: zod.string().min(1, 'Driver selection is required'),
  date: zod.date({ required_error: 'Date is required' }),
  selectedCategory: zod.enum(['bakery', 'fresh']).optional(),
  products: zod.array(zod.object({
    productId: zod.string(),
    productName: zod.string(),
    category: zod.enum(['bakery', 'fresh']),
    quantity: zod.number().min(0, 'Quantity must be non-negative'),
    unitPrice: zod.number().min(0, 'Unit price must be non-negative'),
  })),
  // Product transfer fields
  isProductTransferred: zod.boolean(),
  transferredProducts: zod.array(zod.object({
    productId: zod.string(),
    productName: zod.string(),
    category: zod.enum(['bakery', 'fresh']),
    quantity: zod.number().min(1, 'Quantity must be at least 1'),
    unitPrice: zod.number().min(0, 'Unit price must be non-negative'),
    receivingDriverId: zod.string().min(1, 'Receiving driver is required'),
    receivingDriverName: zod.string(),
    transferredFromDriverId: zod.string(),
    transferredFromDriverName: zod.string(),
  })),
  collectionAmount: zod.coerce.number().min(0, 'Collection amount must be non-negative'),
  purchaseAmount: zod.coerce.number().min(0, 'Purchase amount must be non-negative'),
  expiry: zod.coerce.number().min(0, 'Expiry amount must be non-negative'),
  discount: zod.coerce.number().min(0, 'Discount amount must be non-negative'),
  petrol: zod.coerce.number().min(0, 'Petrol amount must be non-negative'),
  balance: zod.coerce.number().min(0, 'Balance amount must be non-negative'),
});

type TripFormData = zod.infer<typeof tripSchema>;

// Calculation functions
const calculateTotals = (products: TripProduct[], acceptedProducts: TripProduct[] = [], transferredProducts: TripProduct[] = []) => {
  // Combine regular products and accepted products
  const allProducts = [...products, ...acceptedProducts];
  
  // Calculate totals for regular products (including accepted)
  const freshProducts = allProducts.filter(p => p.category === 'fresh');
  const bakeryProducts = allProducts.filter(p => p.category === 'bakery');
  
  // Calculate accepted products totals by category
  const acceptedFreshProducts = acceptedProducts.filter(p => p.category === 'fresh');
  const acceptedBakeryProducts = acceptedProducts.filter(p => p.category === 'bakery');

  const freshTotal = freshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const bakeryTotal = bakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  
  const acceptedFreshTotal = acceptedFreshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const acceptedBakeryTotal = acceptedBakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  // Calculate transferred products totals (to subtract from sender)
  const transferredFreshProducts = transferredProducts.filter(p => p.category === 'fresh');
  const transferredBakeryProducts = transferredProducts.filter(p => p.category === 'bakery');
  
  const transferredFreshTotal = transferredFreshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const transferredBakeryTotal = transferredBakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  // Calculate net totals after subtracting transferred products
  const freshNetTotal = (freshTotal - transferredFreshTotal) * (1 - 0.115); // 11.5% reduction
  const bakeryNetTotal = (bakeryTotal - transferredBakeryTotal) * (1 - 0.16); // 16% reduction

  const freshGrandTotal = freshNetTotal * 1.05; // 5% addition
  const bakeryGrandTotal = bakeryNetTotal * 1.05; // 5% addition

  return {
    fresh: { 
      total: freshTotal, 
      accepted: acceptedFreshTotal,
      transferred: transferredFreshTotal,
      netTotal: freshNetTotal, 
      grandTotal: freshGrandTotal 
    },
    bakery: { 
      total: bakeryTotal, 
      accepted: acceptedBakeryTotal,
      transferred: transferredBakeryTotal,
      netTotal: bakeryNetTotal, 
      grandTotal: bakeryGrandTotal 
    },
    overall: {
      total: freshTotal + bakeryTotal - transferredFreshTotal - transferredBakeryTotal,
      netTotal: freshNetTotal + bakeryNetTotal,
      grandTotal: freshGrandTotal + bakeryGrandTotal
    }
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
  const { trips, addTrip, updateTrip, deleteTrip, canAddTripForDriver } = useDailyTrips();
  const { showSuccess, showError } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const [editingTrip, setEditingTrip] = React.useState<DailyTrip | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [tripToDelete, setTripToDelete] = React.useState<DailyTrip | null>(null);
  const [filteredTrips, setFilteredTrips] = React.useState<DailyTrip[]>([]);
  const [driverFilter, setDriverFilter] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState<string>(dayjs().subtract(9, 'day').format('YYYY-MM-DD'));
  const [dateTo, setDateTo] = React.useState<string>(dayjs().format('YYYY-MM-DD'));
  const [mounted, setMounted] = React.useState(false);
  const [selectedDriverId, setSelectedDriverId] = React.useState<string>('');
  
  // Transfer product form state
  const [transferForm, setTransferForm] = React.useState({
    productId: '',
    quantity: 1,
    receivingDriverId: '',
  });
  
  // Product search state
  const [productSearch, setProductSearch] = React.useState('');
  const [filteredProducts, setFilteredProducts] = React.useState(products);

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
      selectedCategory: 'bakery',
      products: [],
      isProductTransferred: false,
      transferredProducts: [],
      collectionAmount: 0,
      purchaseAmount: 0,
      expiry: 0,
      discount: 0,
      petrol: 0,
      balance: 0,
    },
    mode: 'onChange',
  });

  const watchedProducts = watch('products');
  const watchedIsProductTransferred = watch('isProductTransferred');
  const watchedTransferredProducts = watch('transferredProducts');
  const watchedDate = watch('date');

  // Debug logging for drivers
  const currentDriverId = watch('driverId');
  React.useEffect(() => {
    // console.log('=== DRIVER DEBUG INFO ===');
    // console.log('Available drivers:', drivers);
    // console.log('Drivers length:', drivers.length);
    // console.log('Current driver ID:', currentDriverId);
    // console.log('Current driver ID type:', typeof currentDriverId);
    // console.log('Filtered drivers for transfer:', drivers.filter(d => d.id !== currentDriverId));
    // console.log('Filtered drivers count:', drivers.filter(d => d.id !== currentDriverId).length);
    // console.log('Transfer form receiving driver ID:', transferForm.receivingDriverId);
    // console.log('========================');
  }, [drivers, currentDriverId, transferForm.receivingDriverId]);

  // Filter products based on search
  React.useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.id.toLowerCase().includes(productSearch.toLowerCase())
      ).sort((a, b) => a.id.localeCompare(b.id));
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);

  // Get available drivers (excluding those who already have trips for the selected date)
  const getAvailableDrivers = React.useCallback(() => {
    if (!watchedDate) return drivers;
    
    return drivers.filter(driver => canAddTripForDriver(driver.id, watchedDate.toISOString().split('T')[0]));
  }, [drivers, watchedDate, canAddTripForDriver]);

  // Calculation functions

  const handleOpen = () => {
    setEditingTrip(null);
    setSelectedDriverId('');
    setProductSearch('');
    reset({
      driverId: '',
      date: dayjs().toDate(),
      selectedCategory: 'bakery',
      products: [],
      isProductTransferred: false,
      transferredProducts: [],
      collectionAmount: 0,
      purchaseAmount: 0,
      expiry: 0,
      discount: 0,
      petrol: 0,
      balance: 0,
    });
    setOpen(true);
  };

  const handleEdit = (trip: DailyTrip) => {
    // console.log('handleEdit called with trip:', trip);
    setEditingTrip(trip);
    setSelectedDriverId(trip.driverId);
    setProductSearch('');
    
    const tripDate = dayjs(trip.date).toDate();
    // console.log('Original date:', trip.date);
    // console.log('Converted date:', tripDate);
    
    // Ensure all numeric fields have valid values
    const safeBalance = typeof trip.balance === 'number' ? trip.balance : 0;
    const safeCollectionAmount = typeof trip.collectionAmount === 'number' ? trip.collectionAmount : 0;
    const safePurchaseAmount = typeof trip.purchaseAmount === 'number' ? trip.purchaseAmount : 0;
    const safeExpiry = typeof trip.expiry === 'number' ? trip.expiry : 0;
    const safeDiscount = typeof trip.discount === 'number' ? trip.discount : 0;
    const safePetrol = typeof trip.petrol === 'number' ? trip.petrol : 0;
    
    reset({
      driverId: trip.driverId,
      date: tripDate,
      isProductTransferred: trip.transfer.isProductTransferred,
      transferredProducts: trip.transfer.transferredProducts,
      selectedCategory: 'bakery',
      products: trip.products,
      collectionAmount: safeCollectionAmount,
      purchaseAmount: safePurchaseAmount,
      expiry: safeExpiry,
      discount: safeDiscount,
      petrol: safePetrol,
      balance: safeBalance,
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
    // console.log('Frontend handleDelete called with trip ID:', tripId);
    // console.log('Trip ID type:', typeof tripId);
    
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      setTripToDelete(trip);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = () => {
    if (tripToDelete) {
      deleteTrip(tripToDelete.id);
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTripToDelete(null);
  };

  const handleApplyFilter = React.useCallback(() => {
    let filtered = trips;

    // Filter by driver
    if (driverFilter) {
      filtered = filtered.filter(trip => trip.driverId === driverFilter);
    }

    // Filter by date range (inclusive of both from and to dates)
    if (dateFrom && dateTo) {
      const fromDate = dayjs(dateFrom).startOf('day').utc();
      const toDate = dayjs(dateTo).endOf('day').utc();

      filtered = filtered.filter(trip => {
        const tripDate = dayjs(trip.date).utc();
        // Check if trip date is on or after fromDate and on or before toDate (inclusive)
        return (tripDate.isAfter(fromDate) || tripDate.isSame(fromDate)) && 
               (tripDate.isBefore(toDate) || tripDate.isSame(toDate));
      });
    }

    // Sort by date descending (newest first), then by createdAt descending
    filtered = filtered.sort((a, b) => {
      const dateComparison = dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are the same, sort by createdAt (newest first)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

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

  const addTransferredProduct = (productId: string, quantity: number, receivingDriverId: string) => {
    const product = products.find(p => p.id === productId);
    const receivingDriver = drivers.find(d => d.id === receivingDriverId);
    const currentDriver = drivers.find(d => d.id === watch('driverId'));
    
    if (product && receivingDriver && currentDriver) {
      const currentTransferredProducts = watchedTransferredProducts || [];
      const newTransferredProduct = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity,
        unitPrice: product.price,
        receivingDriverId,
        receivingDriverName: receivingDriver.name,
        transferredFromDriverId: currentDriver.id,
        transferredFromDriverName: currentDriver.name,
      };
      
      setValue('transferredProducts', [...currentTransferredProducts, newTransferredProduct]);
    }
  };

  const removeTransferredProduct = (index: number) => {
    const currentTransferredProducts = watchedTransferredProducts || [];
    const updatedProducts = currentTransferredProducts.filter((_, i) => i !== index);
    setValue('transferredProducts', updatedProducts);
  };

  const handleAddTransferredProduct = () => {
    if (transferForm.productId && transferForm.quantity > 0 && transferForm.receivingDriverId) {
      addTransferredProduct(transferForm.productId, transferForm.quantity, transferForm.receivingDriverId);
      // Reset form
      setTransferForm({
        productId: '',
        quantity: 1,
        receivingDriverId: '',
      });
      setProductSearch('');
    }
  };

  const onSubmit = async (data: TripFormData) => {
    // console.log('onSubmit called with data:', data);
    // console.log('editingTrip:', editingTrip);
    
    // Check if this is a new trip and if driver already has a trip for this date
    if (!editingTrip && !canAddTripForDriver(data.driverId, dayjs(data.date).format('YYYY-MM-DD'))) {
      showError(`This driver already has a daily trip for ${dayjs(data.date).format('MMM D, YYYY')}. Please select a different driver or date.`);
      return;
    }

    const driver = drivers.find(d => d.id === data.driverId);
    const filteredProducts = data.products.filter(p => p.quantity > 0);
    const filteredTransferredProducts = data.transferredProducts.filter(p => p.quantity > 0);

    const transfer: ProductTransfer = {
      isProductTransferred: data.isProductTransferred,
      transferredProducts: filteredTransferredProducts,
    };

    // Calculate totals for financial metrics
    const totals = calculateTotals(
      filteredProducts,
      [],
      filteredTransferredProducts
    );

    const tripData: Omit<DailyTrip, 'id' | 'createdAt' | 'updatedAt'> = {
      driverId: data.driverId,
      driverName: driver?.name || '',
      date: dayjs(data.date).format('YYYY-MM-DD'),
      products: filteredProducts,
      transfer,
      acceptedProducts: [], // Will be populated by context when products are transferred to this driver
      collectionAmount: data.collectionAmount,
      purchaseAmount: data.purchaseAmount,
      expiry: data.expiry,
      discount: data.discount,
      petrol: data.petrol,
      balance: roundBalance(data.balance),
      totalAmount: totals.overall.total,
      netTotal: totals.overall.netTotal,
      grandTotal: totals.overall.grandTotal,
      expiryAfterTax: 0, // Will be calculated in context
      amountToBe: 0, // Will be calculated in context
      salesDifference: 0, // Will be calculated in context
      profit: 0, // Will be calculated in context
    };

    setIsSaving(true);
    try {
      // console.log('About to call updateTrip/addTrip with tripData:', tripData);
      if (editingTrip) {
        // console.log('Calling updateTrip for trip ID:', editingTrip.id);
        await updateTrip(editingTrip.id, tripData);
        // console.log('updateTrip succeeded');
        showSuccess('Daily trip updated successfully!');
      } else {
        // console.log('Calling addTrip');
        await addTrip(tripData);
        // console.log('addTrip succeeded');
        showSuccess('Daily trip created successfully!');
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save trip:', error);
      showError('Failed to save daily trip. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
            <InputLabel>All Drivers</InputLabel>
            <Select
              value={driverFilter}
              label="All Drivers"
              displayEmpty
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
        </Stack>

      <Stack spacing={2}>
        {filteredTrips.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">
              No records available at this time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try adjusting your date range or driver filter
            </Typography>
          </Paper>
        ) : (
          filteredTrips.map((trip, index) => (
          <Card key={trip.id} sx={{ 
            p: 2, 
            bgcolor: index % 2 === 0 ? 'blue.50' : 'white',
            border: '1px solid',
            borderColor: 'blue.100'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                {trip.driverName} - {dayjs(trip.date).format('MMM D, YYYY')}
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
              {trip.transfer.isProductTransferred && trip.transfer.transferredProducts.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Products Transferred
                  </Typography>
                  
                  <Stack spacing={1}>
                    {trip.transfer.transferredProducts.map((transferredProduct, index) => (
                      <Box key={index} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.100' }}>
                        <Typography variant="body2">
                          {transferredProduct.productName} (Qty: {transferredProduct.quantity}) - Transfer to: {transferredProduct.receivingDriverName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          AED {transferredProduct.unitPrice.toFixed(2)} × {transferredProduct.quantity} = AED {(transferredProduct.unitPrice * transferredProduct.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}

              {trip.acceptedProducts && trip.acceptedProducts.length > 0 && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Products Accepted from Other Drivers
                  </Typography>
                  
                  <Stack spacing={1}>
                    {trip.acceptedProducts.map((acceptedProduct, index) => (
                      <Box key={index} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.100' }}>
                        <Typography variant="body2">
                          {acceptedProduct.productName} (Qty: {acceptedProduct.quantity})
                          {acceptedProduct.transferredFromDriverName && (
                            <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                              {' '}- From: {acceptedProduct.transferredFromDriverName}
                            </span>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          AED {acceptedProduct.unitPrice.toFixed(2)} × {acceptedProduct.quantity} = AED {(acceptedProduct.unitPrice * acceptedProduct.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}

              <Box sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1,
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          backgroundColor: 'rgba(76, 175, 80, 0.1) !important', 
                          color: '#2e7d32 !important', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          borderRight: '1px solid #e0e0e0',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          '&.MuiTableCell-root': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1) !important',
                            color: '#2e7d32 !important'
                          }
                        }}
                      >
                        Fresh Items
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          backgroundColor: 'rgba(33, 150, 243, 0.1) !important', 
                          color: '#1565c0 !important', 
                          fontWeight: 'bold',
                          textAlign: 'center',
                          position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          '&.MuiTableCell-root': {
                            backgroundColor: 'rgba(33, 150, 243, 0.1) !important',
                            color: '#1565c0 !important'
                          }
                        }}
                      >
                        Bakery Items
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const freshProducts = trip.products.filter(p => p.category === 'fresh');
                      const bakeryProducts = trip.products.filter(p => p.category === 'bakery');
                      const maxRows = Math.max(freshProducts.length, bakeryProducts.length);
                      
                      return Array.from({ length: maxRows }, (_, index) => (
                        <TableRow key={`product-row-${index}`}>
                          <TableCell sx={{ borderRight: '1px solid #e0e0e0', width: '50%' }}>
                            {freshProducts[index] ? (
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  {freshProducts[index].productId}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {freshProducts[index].productName}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2e7d32' }}>
                                  Qty: {freshProducts[index].quantity}
                                </Typography>
                              </Box>
                            ) : null}
                          </TableCell>
                          <TableCell sx={{ width: '50%' }}>
                            {bakeryProducts[index] ? (
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  {bakeryProducts[index].productId}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {bakeryProducts[index].productName}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#1565c0' }}>
                                  Qty: {bakeryProducts[index].quantity}
                                </Typography>
                              </Box>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </Box>

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
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">Petrol</Typography>
                    <Typography variant="h6" color="error.main">AED {trip.petrol.toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="body2" color="text.secondary">Balance</Typography>
                    <Typography variant="h6" color="info.main">AED {roundBalance(trip.balance ?? 0)}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Calculated Financial Metrics */}
              <Paper sx={{ p: 2, bgcolor: 'primary.50', border: 2, borderColor: 'primary.main' }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Calculated Financial Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="body2" color="text.secondary">Expiry After Tax</Typography>
                    <Typography variant="h6" color="warning.dark">AED {(trip.expiryAfterTax ?? 0).toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="body2" color="text.secondary">Amount To Be</Typography>
                    <Typography variant="h6" color="info.dark">AED {(trip.amountToBe ?? 0).toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="body2" color="text.secondary">Sales Difference</Typography>
                    <Typography variant="h6" color={(trip.salesDifference ?? 0) >= 0 ? 'success.dark' : 'error.dark'}>
                      AED {(trip.salesDifference ?? 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="body2" color="text.secondary">Profit</Typography>
                    <Typography variant="h6" color={(trip.profit ?? 0) >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold' }}>
                      AED {(trip.profit ?? 0).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography variant="body2" color="text.secondary">Calculated Balance</Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      AED {roundBalance(trip.balance ?? 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {trip.products.length > 0 && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Product Calculations</Typography>
                  {(() => {
                    const totals = calculateTotals(
                      trip.products, 
                      trip.acceptedProducts || [], 
                      trip.transfer?.transferredProducts || []
                    );
                    return (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>Fresh Items</Typography>
                          <Typography variant="body2">Total: AED {totals.fresh.total.toFixed(2)}</Typography>
                          {totals.fresh.accepted > 0 && (
                            <Typography variant="body2" color="success.main">
                              Accepted: +AED {totals.fresh.accepted.toFixed(2)}
                            </Typography>
                          )}
                          {totals.fresh.transferred > 0 && (
                            <Typography variant="body2" color="warning.main">
                              Transferred: -AED {totals.fresh.transferred.toFixed(2)}
                            </Typography>
                          )}
                          <Typography variant="body2">Net Total: AED {totals.fresh.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.fresh.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>Bakery Items</Typography>
                          <Typography variant="body2">Total: AED {totals.bakery.total.toFixed(2)}</Typography>
                          {totals.bakery.accepted > 0 && (
                            <Typography variant="body2" color="success.main">
                              Accepted: +AED {totals.bakery.accepted.toFixed(2)}
                            </Typography>
                          )}
                          {totals.bakery.transferred > 0 && (
                            <Typography variant="body2" color="warning.main">
                              Transferred: -AED {totals.bakery.transferred.toFixed(2)}
                            </Typography>
                          )}
                          <Typography variant="body2">Net Total: AED {totals.bakery.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.bakery.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </Paper>
              )}
            </Stack>
          </Card>
        )))}
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
        PaperProps={{
          sx: {
            '& .MuiSelect-select': {
              zIndex: 'auto'
            }
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
                    fontWeight: 500,
                    lineHeight: 1.2
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
                      Select a driver from the list below
                    </Typography>
                  )}
                </Box>
                
                {/* Driver selection cards */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                    Available Drivers:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getAvailableDrivers().length > 0 ? (
                      getAvailableDrivers().map((driver) => (
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
                      ))
                    ) : (
                      <Box sx={{ 
                        p: 2, 
                        border: '1px dashed #ccc', 
                        borderRadius: 1, 
                        bgcolor: 'grey.50',
                        minWidth: '200px'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          No drivers available for this date
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          All drivers already have trips for {watchedDate ? dayjs(watchedDate).format('MMM D, YYYY') : 'this date'}
                        </Typography>
                      </Box>
                    )}
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
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(newValue) => {
                          // console.log('Date picker changed to:', newValue?.format('YYYY-MM-DD'));
                          field.onChange(newValue?.toDate());
                        }}
                        maxDate={dayjs()} // Prevent future dates
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: Boolean(errors.date),
                              helperText: errors.date?.message || 'Click to select a date (past dates only)',
                            },
                            popper: {
                              sx: {
                                zIndex: 2000,
                              },
                            },
                          }}
                      />
                    )}
                  />
                </LocalizationProvider>

              {/* Product Transfer Checkbox */}
              <Controller
                control={control}
                name="isProductTransferred"
                render={({ field }) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (!e.target.checked) {
                          setValue('transferredProducts', []);
                        }
                      }}
                    />
                    <Typography variant="body1">Product Transferred</Typography>
                  </Box>
                )}
              />

              {/* Product Transfer Section */}
              {watchedIsProductTransferred && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Transfer Products
                  </Typography>

                  {/* Transfer Product Form */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'flex-end', 
                    mb: 2, 
                    flexWrap: 'wrap',
                    '@media (min-width: 1024px)': {
                      flexWrap: 'nowrap',
                      alignItems: 'flex-end'
                    }
                  }}>
                    <FormControl sx={{ 
                      flex: 1, 
                      minWidth: '200px',
                      '@media (min-width: 1024px)': {
                        flex: '2 1 0'
                      }
                    }}>
                      <TextField
                        label="Search Product (Name or ID)"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Type product name or ID..."
                        size="small"
                      />
                      {productSearch && filteredProducts.length > 0 && (
                        <Paper sx={{ 
                          mt: 1, 
                          maxHeight: 200, 
                          overflow: 'auto', 
                          position: 'absolute', 
                          zIndex: 2000, 
                          width: '100%',
                          boxShadow: 3,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          <Stack>
                            {filteredProducts.map((product) => (
                              <Box
                                key={product.id}
                                sx={{
                                  p: 1,
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'action.hover' },
                                  borderBottom: '1px solid',
                                  borderColor: 'divider'
                                }}
                                onClick={() => {
                                  setTransferForm(prev => ({ ...prev, productId: product.id }));
                                  setProductSearch(`${product.id} - ${product.name} (AED ${product.price.toFixed(2)})`);
                                }}
                              >
                                <Typography variant="body2" fontWeight={600}>
                                  {product.id} - {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  AED {product.price.toFixed(2)} per unit
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Paper>
                      )}
                      {productSearch && filteredProducts.length === 0 && (
                        <Paper sx={{ 
                          mt: 1, 
                          p: 2, 
                          position: 'absolute', 
                          zIndex: 2000, 
                          width: '100%',
                          boxShadow: 3,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            No products found matching &quot;{productSearch}&quot;
                          </Typography>
                        </Paper>
                      )}
                    </FormControl>
                    
                    <TextField
                      label="Transfer Quantity"
                      type="number"
                      size="small"
                      sx={{ 
                        width: 140,
                        '@media (min-width: 1024px)': {
                          width: 160,
                          flex: '0 0 auto'
                        },
                        '& .MuiInputBase-input': {
                          cursor: 'text',
                          pointerEvents: 'auto',
                        }
                      }}
                      inputProps={{ 
                        min: 1,
                        style: { textAlign: 'center', fontWeight: 'bold' }
                      }}
                      value={transferForm.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTransferForm(prev => ({ ...prev, quantity: value === '' ? 1 : Number.parseInt(value) || 1 }));
                      }}
                      onFocus={(e) => {
                        e.target.select();
                      }}
                    />
                    
                    <Box sx={{ 
                      flex: 1,
                      '@media (min-width: 1024px)': {
                        flex: '1.5 1 0'
                      }
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          mb: 1,
                          ml: 0,
                          lineHeight: 1.2
                        }}
                      >
                        Transfer To Driver *
                      </Typography>
                      <FormControl fullWidth size="small" sx={{ minHeight: 56 }}>
                        <InputLabel 
                          sx={{ 
                            fontSize: '0.875rem',
                            '&.MuiInputLabel-shrink': {
                              transform: 'translate(14px, -9px) scale(0.75)',
                              transformOrigin: 'top left'
                            }
                          }}
                        >
                          Select Receiving Driver
                        </InputLabel>
                        <Select
                          value={transferForm.receivingDriverId}
                          onChange={(e) => {
                            // console.log('Transfer driver dropdown changed to:', e.target.value);
                            setTransferForm(prev => ({ ...prev, receivingDriverId: e.target.value }));
                          }}
                          label="Select Receiving Driver"
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                zIndex: 2000,
                                boxShadow: 3,
                                border: '1px solid',
                                borderColor: 'divider'
                              },
                            },
                            sx: {
                              zIndex: 2000
                            }
                          }}
                          onClick={() => {
                            // console.log('Transfer driver dropdown clicked');
                            // console.log('Current drivers state:', drivers);
                            // console.log('Current driver ID:', currentDriverId);
                            // console.log('Available drivers:', currentDriverId ? drivers.filter(d => d.id !== currentDriverId) : drivers);
                          }}
                          onOpen={() => {
                            // console.log('Transfer driver dropdown opened');
                          }}
                          onClose={() => {
                            // console.log('Transfer driver dropdown closed');
                          }}
                        >
                          {(() => {
                            if (!drivers || drivers.length === 0) {
                              return <MenuItem disabled>No drivers available</MenuItem>;
                            }
                            
                            const availableDrivers = currentDriverId 
                              ? drivers.filter(d => d.id !== currentDriverId)
                              : drivers;
                            
                            // console.log('Rendering', availableDrivers.length, 'MenuItems for drivers');
                            
                            return availableDrivers.map((driver) => {
                              return (
                                <MenuItem key={driver.id} value={driver.id}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {driver.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {driver.routeName}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              );
                            });
                          })()}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Button
                      variant="contained"
                      onClick={handleAddTransferredProduct}
                      disabled={!transferForm.productId || !transferForm.receivingDriverId || transferForm.quantity <= 0}
                    >
                      Add Transfer
                    </Button>
                  </Box>

                  {/* List of Transferred Products */}
                  {watchedTransferredProducts.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Transferred Products ({watchedTransferredProducts.length})
                      </Typography>
                      <Stack spacing={1}>
                        {watchedTransferredProducts.map((transferredProduct, index) => {
                          const product = products.find(p => p.id === transferredProduct.productId);
                          const receivingDriver = drivers.find(d => d.id === transferredProduct.receivingDriverId);
                          return (
                            <Box key={index} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50' }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {product?.name || transferredProduct.productName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Quantity: {transferredProduct.quantity} | Transfer to: {receivingDriver?.name || transferredProduct.receivingDriverName}
                                  </Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeTransferredProduct(index)}
                                >
                                  <TrashIcon />
                                </IconButton>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {/* Product Selection */}
              <Typography variant="h6">Select Products</Typography>
              
              <Grid container spacing={3}>
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
                            label="Quantity"
                            size="small"
                            sx={{ 
                              width: 120,
                              '& .MuiInputBase-input': {
                                cursor: 'text',
                                pointerEvents: 'auto',
                              }
                            }}
                            inputProps={{ 
                              min: 0,
                              style: { textAlign: 'center', fontWeight: 'bold' }
                            }}
                            value={watchedProducts?.find(p => p.productId === product.id)?.quantity || 0}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleProductQuantityChange(product.id, value === '' ? 0 : Number.parseInt(value) || 0);
                            }}
                            onFocus={(e) => {
                              e.target.select();
                            }}
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
                            label="Quantity"
                            size="small"
                            sx={{ 
                              width: 120,
                              '& .MuiInputBase-input': {
                                cursor: 'text',
                                pointerEvents: 'auto',
                              }
                            }}
                            inputProps={{ 
                              min: 0,
                              style: { textAlign: 'center', fontWeight: 'bold' }
                            }}
                            value={watchedProducts?.find(p => p.productId === product.id)?.quantity || 0}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleProductQuantityChange(product.id, value === '' ? 0 : Number.parseInt(value) || 0);
                            }}
                            onFocus={(e) => {
                              e.target.select();
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>

              {/* Accepted Products View (Read-only in edit mode) */}
              {editingTrip && editingTrip.acceptedProducts && editingTrip.acceptedProducts.length > 0 && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.100' }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                    Products Accepted from Other Drivers (Read-only)
                  </Typography>
                  <Stack spacing={1}>
                    {editingTrip.acceptedProducts.map((acceptedProduct, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'grey.50'
                        }}
                      >
                        <Typography variant="body2">
                          {acceptedProduct.productName} (Qty: {acceptedProduct.quantity})
                          {acceptedProduct.transferredFromDriverName && (
                            <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                              {' '}- From: {acceptedProduct.transferredFromDriverName}
                            </span>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          AED {acceptedProduct.unitPrice.toFixed(2)} × {acceptedProduct.quantity} = AED {(acceptedProduct.unitPrice * acceptedProduct.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
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
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        value={field.value || ''}
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
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        value={field.value || ''}
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
                        inputProps={{ min: 0, step: 0.01 }}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        value={field.value || ''}
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
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        value={field.value || ''}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="petrol"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Petrol (AED)"
                        type="number"
                        fullWidth
                        error={Boolean(errors.petrol)}
                        helperText={errors.petrol?.message}
                        inputProps={{ min: 0, step: 0.01 }}
                        onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        value={field.value || ''}
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
                    const totals = calculateTotals(
                      watchedProducts, 
                      [], 
                      watchedTransferredProducts || []
                    );
                    return (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>Fresh Items</Typography>
                          <Typography variant="body2">Total: AED {totals.fresh.total.toFixed(2)}</Typography>
                          {totals.fresh.accepted > 0 && (
                            <Typography variant="body2" color="success.main">
                              Accepted: +AED {totals.fresh.accepted.toFixed(2)}
                            </Typography>
                          )}
                          {totals.fresh.transferred > 0 && (
                            <Typography variant="body2" color="warning.main">
                              Transferred: -AED {totals.fresh.transferred.toFixed(2)}
                            </Typography>
                          )}
                          <Typography variant="body2">Net Total: AED {totals.fresh.netTotal.toFixed(2)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Grand Total: AED {totals.fresh.grandTotal.toFixed(2)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="subtitle2" color="primary.main" sx={{ mb: 1 }}>Bakery Items</Typography>
                          <Typography variant="body2">Total: AED {totals.bakery.total.toFixed(2)}</Typography>
                          {totals.bakery.accepted > 0 && (
                            <Typography variant="body2" color="success.main">
                              Accepted: +AED {totals.bakery.accepted.toFixed(2)}
                            </Typography>
                          )}
                          {totals.bakery.transferred > 0 && (
                            <Typography variant="body2" color="warning.main">
                              Transferred: -AED {totals.bakery.transferred.toFixed(2)}
                            </Typography>
                          )}
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
            <Button onClick={handleClose} disabled={isSaving}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
              onClick={() => {
                // console.log('Save button clicked');
                // console.log('Form errors:', errors);
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
          <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
            open={isSaving}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
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
    </Stack>
  );
}
