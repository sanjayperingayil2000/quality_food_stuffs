import * as React from 'react';
import type { Metadata } from 'next';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { config } from '@/config';

export const metadata = { title: `Drivers | Dashboard | ${config.site.name}` } satisfies Metadata;

interface Driver {
  id: string;
  name: string;
  phone: string;
  location: string;
  routeName: string;
}

const drivers: Driver[] = [
  { id: 'DRV-001', name: 'Rahul Kumar', phone: '98765 43210', location: 'Coimbatore', routeName: 'CBE → Pollachi' },
  { id: 'DRV-002', name: 'Vijay Anand', phone: '90909 11223', location: 'Pollachi', routeName: 'Pollachi → Udumalpet' },
  { id: 'DRV-003', name: 'Karthik', phone: '90031 77889', location: 'Udumalpet', routeName: 'Udumalpet → Tiruppur' },
  { id: 'DRV-004', name: 'Senthil', phone: '95001 22334', location: 'Tiruppur', routeName: 'Tiruppur → Erode' },
  { id: 'DRV-005', name: 'Suresh', phone: '96555 33445', location: 'Erode', routeName: 'Erode → Coimbatore' },
];

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3} sx={{ px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Drivers</Typography>
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
            <TableCell>Name</TableCell>
            <TableCell>Phone number</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Route name</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow hover key={driver.id}>
              <TableCell>{driver.name}</TableCell>
              <TableCell>{driver.phone}</TableCell>
              <TableCell>{driver.location}</TableCell>
              <TableCell>{driver.routeName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}




