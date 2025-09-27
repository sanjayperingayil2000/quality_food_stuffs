'use client';

import * as React from 'react';
// import type { Metadata } from 'next';
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
import { FilePdfIcon } from '@phosphor-icons/react/dist/ssr/FilePdf';
import { PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TableIcon } from '@phosphor-icons/react/dist/ssr/Table';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// import { config } from '@/config';
import { useProducts, type Product } from '@/contexts/product-context';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// type Category = 'bakery' | 'fresh'; // Unused - using from context

const productSchema = zod.object({
  name: zod.string().min(1, 'Product name is required'),
  price: zod.number().min(0, 'Price must be positive'),
  category: zod.enum(['bakery', 'fresh'], { required_error: 'Category is required' }),
  productId: zod.string().min(1, 'Product ID is required'),
  description: zod.string().optional(),
});

type ProductFormData = zod.infer<typeof productSchema>;

// Products are now loaded from context

function generateProductId(): string {
  const count = Math.floor(Math.random() * 1000) + 1;
  return `PRD-${count.toString().padStart(3, '0')}`;
}

export default function Page(): React.JSX.Element {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [open, setOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('');


  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      category: 'bakery',
      productId: '',
      description: '',
    },
  });

  const handleOpen = () => {
    setEditingProduct(null);
    reset({
      name: '',
      price: 0,
      category: 'bakery',
      productId: generateProductId(),
      description: '',
    });
    setOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      price: product.price,
      category: product.category,
      productId: product.id,
      description: product.description || '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleDelete = (productId: string) => {
    deleteProduct(productId);
  };

  // Auto-filter when categoryFilter changes
  React.useEffect(() => {
    let filtered = products;

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, categoryFilter]);

  const handleExportPdf = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Products List</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            h2 { 
              text-align: center; 
              color: #333; 
              margin-bottom: 20px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #333; 
              padding: 8px; 
              text-align: left; 
              font-size: 11px;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .date {
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Products List</h2>
            <div class="date">Generated on ${dayjs().format('MMMM D, YYYY h:mm A')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price (AED)</th>
                <th>Category</th>
                <th>Product ID</th>
                <th>Last Edited</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.price.toFixed(2)} AED</td>
                  <td>${product.category === 'bakery' ? 'Bakery' : 'Fresh'}</td>
                  <td>${product.id}</td>
                  <td>${dayjs(product.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</td>
                  <td>${dayjs(product.createdAt).tz('Asia/Dubai').format('MMM D, YYYY')} GST</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Open in new tab and trigger download
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(htmlContent);
    printWindow?.document.close();

    // Wait for content to load, then trigger print
    setTimeout(() => {
      printWindow?.print();
    }, 500);
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Product Name', 'Price (AED)', 'Category', 'Product ID', 'Last Edited', 'Created'],
      ...filteredProducts.map(product => [
        product.name,
        `${product.price.toFixed(2)} AED`,
        product.category === 'bakery' ? 'Bakery' : 'Fresh',
        product.id,
        dayjs(product.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A') + ' GST',
        dayjs(product.createdAt).tz('Asia/Dubai').format('MMM D, YYYY') + ' GST'
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

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      // Edit existing product
      updateProduct(editingProduct.id, {
        id: data.productId,
        name: data.name,
        price: data.price,
        category: data.category,
        description: data.description,
        updatedAt: dayjs().utc().toDate(),
      });
    } else {
      // Add new product
      const newProduct: Product = {
        id: data.productId,
        name: data.name,
        price: data.price,
        category: data.category,
        description: data.description,
        createdAt: dayjs().utc().toDate(),
        updatedAt: dayjs().utc().toDate(),
      };
      addProduct(newProduct);
    }
    handleClose();
  };

  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Products</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            color="inherit"
            startIcon={<FilePdfIcon fontSize="var(--icon-fontSize-md)" />}
            onClick={handleExportPdf}
          >
            PDF
          </Button>
          <Button
            color="inherit"
            startIcon={<TableIcon fontSize="var(--icon-fontSize-md)" />}
            onClick={handleExportExcel}
          >
            Excel
          </Button>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" onClick={handleOpen}>
            Add
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="bakery">Bakery</MenuItem>
            <MenuItem value="fresh">Fresh</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Product ID</TableCell>
            <TableCell>Last edited</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow hover key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{`${product.price.toFixed(2)} AED`}</TableCell>
              <TableCell>
                <Chip label={product.category === 'bakery' ? 'Bakery' : 'Fresh'} size="small" color={product.category === 'bakery' ? 'primary' : 'success'} />
              </TableCell>
              <TableCell>{product.id}</TableCell>
              <TableCell>{dayjs(product.updatedAt).tz('Asia/Dubai').format('MMM D, YYYY h:mm A')} GST</TableCell>
              <TableCell>{dayjs(product.createdAt).tz('Asia/Dubai').format('MMM D, YYYY')} GST</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1.5}>
                  <IconButton onClick={() => handleEdit(product)} size="small">
                    <PencilIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(product.id)} size="small" color="error">
                    <TrashIcon />
                  </IconButton>
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
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product name"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price"
                    type="number"
                    // inputProps={{ step: 0.01, min: 0 }}
                    error={Boolean(errors.price)}
                    helperText={errors.price?.message}
                    fullWidth
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                    {errors.category && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                        {errors.category.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                control={control}
                name="productId"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Product ID"
                    error={Boolean(errors.productId)}
                    helperText={errors.productId?.message}
                    fullWidth
                    disabled={false}
                  />
                )}
              />
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />
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



