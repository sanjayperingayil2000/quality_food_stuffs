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
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TableIcon } from '@phosphor-icons/react/dist/ssr/Table';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { ClockClockwiseIcon } from '@phosphor-icons/react/dist/ssr';
import { Tooltip } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { useProducts, type Product } from '@/contexts/product-context';
import { ExportPdfButton } from '@/components/products/export-pdf';

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
    .gt(0, 'Price must be greater than 0'),
  category: zod.enum(['bakery', 'fresh'], { required_error: 'Category is required' }),
  productId: zod.string().min(1, 'Product ID is required'),
});

type ProductFormData = zod.infer<typeof productSchema>;

function generateProductId(): string {
  const count = Math.floor(Math.random() * 1000) + 1;
  return `PRD-${count.toString().padStart(3, '0')}`;
}

// Price History Dialog Component
interface PriceHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductWithHistory | null;
}

const PriceHistoryDialog: React.FC<PriceHistoryDialogProps> = ({ open, onClose, product }) => {
  if (!product) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Price History - {product.name}</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Old Price (AED)</TableCell>
              <TableCell>Updated At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {product.priceHistory?.map((history) => (
              <TableRow key={history.version}>
                <TableCell>{history.price.toFixed(2)}</TableCell>
                <TableCell>{dayjs(history.updatedAt).format('MMM D, YYYY h:mm A')}</TableCell>
                <TableCell>{history.updatedBy}</TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
        <Button onClick={onClose} sx={{ mt: 2 }} variant="contained">Close</Button>
      </DialogContent>
    </Dialog>
  );
};

export default function Page(): React.JSX.Element {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [open, setOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductWithHistory | null>(null);
  const [filteredProducts, setFilteredProducts] = React.useState<ProductWithHistory[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('allCategories');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyProduct, setHistoryProduct] = React.useState<ProductWithHistory | null>(null);

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

    setFilteredProducts(filtered);
  }, [products, categoryFilter, searchQuery]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: 0, category: 'bakery', productId: '' },
  });

  const handleOpen = () => {
    setEditingProduct(null);
    reset({ name: '', price: 0, category: 'bakery', productId: generateProductId() });
    setOpen(true);
  };

  const handleEdit = (product: ProductWithHistory) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      price: product.price,
      category: product.category,
      productId: product.id,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleDelete = (productId: string) => deleteProduct(productId);

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      const prevPrice = editingProduct.price;
      const newPrice = data.price;
      const priceHistory = editingProduct.priceHistory ? [...editingProduct.priceHistory] : [];

      if (prevPrice !== newPrice) {
        priceHistory.push({
          version: priceHistory.length + 1,
          price: prevPrice,
          updatedAt: new Date(),
          updatedBy: 'Admin', // you can replace with actual user
        });
      }

      updateProduct(editingProduct.id, {
        id: data.productId,
        name: data.name,
        price: newPrice,
        category: data.category,
        updatedAt: dayjs().utc().toDate(),
        priceHistory,
      });
    }
    else {

      const newProduct: Product = {
        id: data.productId,
        name: data.name,
        price: data.price,
        category: data.category,
        sku: `PRD-${data.productId}`,
        unit: 'piece',
        minimumQuantity: 1,
        isActive: true,
        createdAt: dayjs().utc().toDate(),
        updatedAt: dayjs().utc().toDate(),
        priceHistory: [],
      }
      addProduct(newProduct);
    }
    handleClose();
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
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center">Product name</TableCell>
            <TableCell align="center">Price</TableCell>
            <TableCell align="center">Category</TableCell>
            <TableCell align="center">Product ID</TableCell>
            <TableCell align="center">Last edited</TableCell>
            <TableCell align="center">Created</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map((product) => (
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
                    <IconButton onClick={() => handleDelete(product.id)} size="small" color="error"><TrashIcon /></IconButton>
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
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
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
                        e.target.value === "" ? undefined : Number.parseFloat(e.target.value)
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
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <TextField {...field} label="Product ID" error={Boolean(errors.productId)} helperText={errors.productId?.message} fullWidth />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      <PriceHistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} product={historyProduct} />
    </Stack>
  );
}
