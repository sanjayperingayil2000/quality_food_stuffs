import * as React from 'react';
import type { Metadata } from 'next';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import dayjs from 'dayjs';

import { config } from '@/config';

export const metadata = { title: `Products | Dashboard | ${config.site.name}` } satisfies Metadata;

type Category = 'bakery' | 'fresh';

interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

const products: Product[] = [
  {
    id: 'PRD-001',
    name: 'Sourdough Bread',
    price: 3.5,
    category: 'bakery',
    createdAt: dayjs().subtract(14, 'day').toDate(),
    updatedAt: dayjs().subtract(1, 'day').toDate(),
  },
  {
    id: 'PRD-002',
    name: 'Blueberry Muffin',
    price: 2.25,
    category: 'bakery',
    createdAt: dayjs().subtract(12, 'day').toDate(),
    updatedAt: dayjs().subtract(2, 'day').toDate(),
  },
  {
    id: 'PRD-003',
    name: 'Whole Wheat Loaf',
    price: 3.0,
    category: 'bakery',
    createdAt: dayjs().subtract(20, 'day').toDate(),
    updatedAt: dayjs().subtract(3, 'day').toDate(),
  },
  {
    id: 'PRD-004',
    name: 'Banana',
    price: 0.45,
    category: 'fresh',
    createdAt: dayjs().subtract(5, 'day').toDate(),
    updatedAt: dayjs().subtract(2, 'hour').toDate(),
  },
  {
    id: 'PRD-005',
    name: 'Strawberries (500g)',
    price: 4.2,
    category: 'fresh',
    createdAt: dayjs().subtract(9, 'day').toDate(),
    updatedAt: dayjs().subtract(6, 'hour').toDate(),
  },
  {
    id: 'PRD-006',
    name: 'Croissant',
    price: 1.8,
    category: 'bakery',
    createdAt: dayjs().subtract(7, 'day').toDate(),
    updatedAt: dayjs().subtract(1, 'day').toDate(),
  },
] ;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Products</Typography>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained">
            Add
          </Button>
        </div>
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
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow hover key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>{`$${product.price.toFixed(2)}`}</TableCell>
              <TableCell>
                <Chip label={product.category === 'bakery' ? 'Bakery' : 'Fresh'} size="small" color={product.category === 'bakery' ? 'primary' : 'success'} />
              </TableCell>
              <TableCell>{product.id}</TableCell>
              <TableCell>{dayjs(product.updatedAt).format('MMM D, YYYY h:mm A')}</TableCell>
              <TableCell>{dayjs(product.createdAt).format('MMM D, YYYY')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}



