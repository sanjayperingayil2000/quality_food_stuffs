'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TableIcon } from '@phosphor-icons/react/dist/ssr/Table';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { ClockClockwiseIcon, CaretUpIcon, CaretDownIcon, ArrowClockwiseIcon } from '@phosphor-icons/react';
import { Tooltip } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { useProducts, type Product } from '@/contexts/product-context';
import { ExportPdfButton } from '@/components/products/export-pdf';
import { useNotifications } from '@/contexts/notification-context';
import { useEmployees } from '@/contexts/employee-context';
import { useUser } from '@/hooks/use-user';
import { apiClient } from '@/lib/api-client';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface PriceHistoryEntry {
  version: number;      // version number
  price: number;        // previous price
  updatedAt: Date;      // timestamp when price was updated
  updatedBy: string;    // user who updated it
}

export interface ProductWithHistory extends Product {
  priceHistory: PriceHistoryEntry[]; // required if you always want history
}


const productSchema = zod.object({
  name: zod.string().min(1, 'Product name is required'),
  price: zod
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price must be 0 or greater'),
  category: zod.enum(['bakery', 'fresh'], { required_error: 'Category is required' }),
});

type ProductFormData = zod.infer<typeof productSchema>;

// Price History Dialog Component
interface PriceHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductWithHistory | null;
}

const PriceHistoryDialog: React.FC<PriceHistoryDialogProps> = ({ open, onClose, product }) => {
  const { employees } = useEmployees();
  const { user } = useUser();
  
  // Resolve and cache userId -> display name (handles ObjectId from backend)
  const [userNameCache, setUserNameCache] = React.useState<Record<string, string>>({});

  const getUserName = (userId: string | undefined): string => {
    if (!userId) return 'Unknown';

    // From cache
    if (userNameCache[userId]) return userNameCache[userId];

    // Check employee IDs (e.g., EMP-001)
    const employee = employees.find(emp => emp.id === userId);
    if (employee) return employee.name;

    // Current logged-in user
    if (user?.id === userId) {
      return user.name || user.firstName || 'Current User';
    }

    // Fallback while we resolve asynchronously
    return 'Loading...';
  };

  // When dialog opens, resolve any unknown ObjectId userIds to names via API and cache them
  React.useEffect(() => {
    const resolveUnknowns = async () => {
      if (!product || !open) return;
      const uniqueIds = [...new Set(product.priceHistory?.map(h => h.updatedBy).filter(Boolean) as string[])];
      const toFetch = uniqueIds.filter(id => !userNameCache[id] && !employees.some(e => e.id === id));
      if (toFetch.length === 0) return;
      const updates: Record<string, string> = {};
      await Promise.all(toFetch.map(async (id) => {
        try {
          // Heuristic: likely a Mongo ObjectId (24 hex chars)
          if (/^[a-f\d]{24}$/i.test(id)) {
            const res = await apiClient.getUser(id);
            if (!res.error && res.data?.user) {
              updates[id] = res.data.user.name;
            }
          }
        } catch {
          // ignore
        }
      }));
      if (Object.keys(updates).length > 0) {
        setUserNameCache(prev => ({ ...prev, ...updates }));
      }
    };
    resolveUnknowns();
  }, [product, open, employees, userNameCache]);
  
  if (!product) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Price History - {product.name}</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Price (AED)</TableCell>
              <TableCell>Updated At</TableCell>
              <TableCell>Updated By</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {product.priceHistory?.map((history) => (
              <TableRow key={history.version}>
                <TableCell>{history.price.toFixed(2)}</TableCell>
                <TableCell>{dayjs(history.updatedAt).format('MMM D, YYYY h:mm A')}</TableCell>
                <TableCell>{getUserName(history.updatedBy)}</TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
        <Button onClick={onClose} sx={{ mt: 2 }} variant="contained">Close</Button>
      </DialogContent>
    </Dialog>
  );
};

// Skeleton Component for Loading State
const ProductTableSkeleton: React.FC = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="text" /></TableCell>
          <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
        </TableRow>
      ))}
    </>
  );
};

export default function Page(): React.JSX.Element {
  const { products, addProduct, updateProduct, deleteProduct, isLoading: isLoadingProducts } = useProducts();
  const { showSuccess, showError } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<ProductWithHistory | null>(null);
  const [editingProduct, setEditingProduct] = React.useState<ProductWithHistory | null>(null);
  const [filteredProducts, setFilteredProducts] = React.useState<ProductWithHistory[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('allCategories');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyProduct, setHistoryProduct] = React.useState<ProductWithHistory | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  // Loading states for actions
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Helper function to generate product ID based on category
  const generateProductId = (category: 'bakery' | 'fresh'): string => {
    // Get the last ID for the specific category
    const categoryProducts = products.filter(p => p.category === category);
    const lastId = categoryProducts.length > 0 ? categoryProducts.at(-1)?.id : null;
    
    let nextNumber = 1;
    if (lastId) {
      // Extract number from existing ID (e.g., PRD-FRS-001 -> 1)
      const match = lastId.match(/PRD-(FRS|BAK)-(\d+)/);
      if (match) {
        nextNumber = Number.parseInt(match[2], 10) + 1;
      }
    }
    
    const prefix = category === 'fresh' ? 'FRS' : 'BAK';
    return `PRD-${prefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  // Helper function to generate display number based on category
  const generateDisplayNumber = (category: 'bakery' | 'fresh'): string => {
    const categoryPrefix = category === 'fresh' ? 'F' : 'B';
    const categoryProducts = products.filter(p => p.category === category);
    const lastId = categoryProducts.length > 0 ? categoryProducts.at(-1)?.id : null;
    
    let nextNumber = 1;
    if (lastId) {
      const match = lastId.match(/PRD-(FRS|BAK)-(\d+)/);
      if (match) {
        nextNumber = Number.parseInt(match[2], 10) + 1;
      }
    }
    
    return `${categoryPrefix}${String(nextNumber).padStart(3, '0')}`;
  };

  React.useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = products as ProductWithHistory[];

    if (categoryFilter !== 'allCategories') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    if (query !== '') {
      filtered = filtered.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(query);
        const idMatch = product.id.toLowerCase().includes(query);
        return nameMatch || idMatch;
      });
    }

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case 'name': {
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          }
          case 'id': {
            aValue = a.id;
            bValue = b.id;
            break;
          }
          case 'price': {
            aValue = a.price;
            bValue = b.price;
            break;
          }
          case 'updatedAt': {
            aValue = dayjs(a.updatedAt).valueOf();
            bValue = dayjs(b.updatedAt).valueOf();
            break;
          }
          case 'createdAt': {
            aValue = dayjs(a.createdAt).valueOf();
            bValue = dayjs(b.createdAt).valueOf();
            break;
          }
          default: {
            return 0;
          }
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProducts(filtered);
  }, [products, categoryFilter, searchQuery, sortField, sortDirection]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: 0, category: 'bakery' },
  });

  const watchedCategory = watch('category');

  const handleOpen = () => {
    setEditingProduct(null);
    reset({ name: '', price: 0, category: 'bakery' });
    setOpen(true);
  };

  const handleEdit = (product: ProductWithHistory) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      price: product.price,
      category: product.category,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    reset();
    setIsSaving(false);
  };

  const handleDeleteClick = (product: ProductWithHistory) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      showSuccess('Product deleted successfully!');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch {
      showError('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    setIsDeleting(false);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: data.name,
          price: data.price,
          category: data.category,
          updatedAt: dayjs().utc().toDate(),
        });
        showSuccess('Product updated successfully!');
      } else {
        const newProductId = generateProductId(data.category);
        const newDisplayNumber = generateDisplayNumber(data.category);
        const newProduct: Product = {
          id: newProductId,
          displayNumber: newDisplayNumber,
          name: data.name,
          price: data.price,
          category: data.category,
          sku: newProductId,
          unit: 'piece',
          minimumQuantity: 1,
          isActive: true,
          createdAt: dayjs().utc().toDate(),
          updatedAt: dayjs().utc().toDate(),
          priceHistory: [],
        };
        await addProduct(newProduct);
        showSuccess('Product added successfully!');
      }
      handleClose();
    } catch {
      showError('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Product Name', 'Price (AED)', 'Category', 'Product ID', 'Last Edited', 'Created'],
      ...filteredProducts.map(product => [
        product.name,
        product.price.toFixed(2) + ' AED',
        product.category === 'bakery' ? 'Bakery' : 'Fresh',
        product.id,
        dayjs(product.updatedAt).format('MMM D, YYYY h:mm A'),
        dayjs(product.createdAt).format('MMM D, YYYY')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setCategoryFilter('allCategories');
    setSearchQuery('');
    setSortField(null);
    setSortDirection('asc');
  };



  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3} justifyContent="space-between">
        <Typography variant="h4">Products</Typography>
        <Stack direction="row" spacing={1}>
          {/* <Button color="inherit" startIcon={<FilePdfIcon fontSize="var(--icon-fontSize-md)" />} onClick={handleExportPdf}>PDF</Button> */}
          <ExportPdfButton products={filteredProducts} />
          <Button color="inherit" startIcon={<TableIcon fontSize="var(--icon-fontSize-md)" />} onClick={handleExportExcel}>Excel</Button>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpen}>Add</Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="allCategories">All Categories</MenuItem>
            <MenuItem value="bakery">Bakery</MenuItem>
            <MenuItem value="fresh">Fresh</MenuItem>
          </Select>
        </FormControl>

        <TextField size="small" label="Search by Name or ID" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ minWidth: 250 }} />
        
        <Tooltip title="Reset Filters">
          <IconButton onClick={handleResetFilters} color="primary">
            <ArrowClockwiseIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                Product name
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
                  <CaretUpIcon size={12} style={{ opacity: sortField === 'name' && sortDirection === 'asc' ? 1 : 0.3 }} />
                  <CaretDownIcon size={12} style={{ opacity: sortField === 'name' && sortDirection === 'desc' ? 1 : 0.3 }} />
                </Box>
              </Box>
            </TableCell>
            <TableCell align="center" sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('price')}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                Price
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
                  <CaretUpIcon size={12} style={{ opacity: sortField === 'price' && sortDirection === 'asc' ? 1 : 0.3 }} />
                  <CaretDownIcon size={12} style={{ opacity: sortField === 'price' && sortDirection === 'desc' ? 1 : 0.3 }} />
                </Box>
              </Box>
            </TableCell>
            <TableCell align="center">Category</TableCell>
            <TableCell align="center" sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('id')}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                Product ID
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
                  <CaretUpIcon size={12} style={{ opacity: sortField === 'id' && sortDirection === 'asc' ? 1 : 0.3 }} />
                  <CaretDownIcon size={12} style={{ opacity: sortField === 'id' && sortDirection === 'desc' ? 1 : 0.3 }} />
                </Box>
              </Box>
            </TableCell>
            <TableCell align="center" sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('updatedAt')}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                Last edited
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
                  <CaretUpIcon size={12} style={{ opacity: sortField === 'updatedAt' && sortDirection === 'asc' ? 1 : 0.3 }} />
                  <CaretDownIcon size={12} style={{ opacity: sortField === 'updatedAt' && sortDirection === 'desc' ? 1 : 0.3 }} />
                </Box>
              </Box>
            </TableCell>
            <TableCell align="center" sx={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('createdAt')}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                Created
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
                  <CaretUpIcon size={12} style={{ opacity: sortField === 'createdAt' && sortDirection === 'asc' ? 1 : 0.3 }} />
                  <CaretDownIcon size={12} style={{ opacity: sortField === 'createdAt' && sortDirection === 'desc' ? 1 : 0.3 }} />
                </Box>
              </Box>
            </TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoadingProducts ? (
            <ProductTableSkeleton />
          ) : filteredProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No products found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredProducts.map((product) => (
              <TableRow hover key={product.id}>
                <TableCell align="center">{product.name}</TableCell>
                <TableCell align="center">{`${product.price.toFixed(2)} AED`}</TableCell>
                <TableCell align="center">
                  <Chip label={product.category === 'bakery' ? 'Bakery' : 'Fresh'} size="small" color={product.category === 'bakery' ? 'primary' : 'success'} />
                </TableCell>
                <TableCell align="center">{product.id}</TableCell>
                <TableCell align="center">{dayjs(product.updatedAt).format('MMM D, YYYY h:mm A')}</TableCell>
                <TableCell align="center">{dayjs(product.createdAt).format('MMM D, YYYY')}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} justifyContent="center">
                    <Tooltip title="Edit Product">
                      <IconButton onClick={() => handleEdit(product)} size="small"><PencilIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton onClick={() => handleDeleteClick(product)} size="small" color="error"><TrashIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="View Price History">
                      <IconButton
                        size="small"
                        onClick={() => { setHistoryProduct(product); setHistoryOpen(true); }}
                      >
                        <ClockClockwiseIcon weight="bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={isSaving ? undefined : handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ position: 'relative' }}>
            {isSaving && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  zIndex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Stack spacing={2} sx={{ pt: 1 }}>
              {/* Product ID - Auto-generated and read-only */}
              <TextField
                label="Product ID"
                value={editingProduct ? editingProduct.id : generateProductId(watchedCategory || 'bakery')}
                disabled
                fullWidth
                helperText="Product ID is automatically generated based on category"
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'text.secondary'
                  }
                }}
              />
              <Controller
                control={control}
                name="name"
                render={({ field }) => <TextField {...field} label="Product name" error={Boolean(errors.name)} helperText={errors.name?.message} fullWidth />}
              />
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price"
                    type="number"
                    error={Boolean(errors.price)}
                    helperText={errors.price?.message}
                    fullWidth
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                      )
                    }
                    slotProps={{
                      input: {
                        inputMode: "decimal",
                      },
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.category)}>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category">
                      <MenuItem value="bakery">Bakery</MenuItem>
                      <MenuItem value="fresh">Fresh</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={16} /> : (editingProduct ? <PencilIcon /> : <PlusIcon />)}
            >
              {isSaving ? (editingProduct ? 'Updating...' : 'Adding...') : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <PriceHistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} product={historyProduct} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={isDeleting ? undefined : handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent sx={{ position: 'relative' }}>
          {isDeleting && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Typography>
            {`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <TrashIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
