'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useUser } from '@/hooks/use-user';

// Mock activity data - in a real app, this would come from an API
const mockActivities = [
  {
    id: '1',
    action: 'Created',
    entity: 'Product',
    entityName: 'Fresh Apples',
    entityId: 'PRD-001',
    user: 'Admin User',
    userId: 'EMP-001',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    details: 'Product created with price AED 15.00'
  },
  {
    id: '2',
    action: 'Updated',
    entity: 'Employee',
    entityName: 'John Doe',
    entityId: 'EMP-002',
    user: 'Manager',
    userId: 'EMP-003',
    timestamp: new Date('2024-01-15T09:15:00Z'),
    details: 'Employee salary updated to AED 3000'
  },
  {
    id: '3',
    action: 'Deleted',
    entity: 'Daily Trip',
    entityName: 'Trip TRP-001',
    entityId: 'TRP-001',
    user: 'Admin User',
    userId: 'EMP-001',
    timestamp: new Date('2024-01-15T08:45:00Z'),
    details: 'Daily trip for David Wilson deleted'
  },
  {
    id: '4',
    action: 'Updated',
    entity: 'Product',
    entityName: 'Bread Loaf',
    entityId: 'PRD-002',
    user: 'Manager',
    userId: 'EMP-003',
    timestamp: new Date('2024-01-14T16:20:00Z'),
    details: 'Product price updated from AED 6.50 to AED 7.00'
  },
  {
    id: '5',
    action: 'Created',
    entity: 'Additional Expense',
    entityName: 'Petrol Expense',
    entityId: 'EXP-001',
    user: 'Admin User',
    userId: 'EMP-001',
    timestamp: new Date('2024-01-14T14:10:00Z'),
    details: 'Petrol expense of AED 150 added for John Doe'
  },
  {
    id: '6',
    action: 'Updated',
    entity: 'Employee',
    entityName: 'Sarah Wilson',
    entityId: 'EMP-004',
    user: 'Admin User',
    userId: 'EMP-001',
    timestamp: new Date('2024-01-14T11:30:00Z'),
    details: 'Employee status changed to inactive'
  },
  {
    id: '7',
    action: 'Created',
    entity: 'Daily Trip',
    entityName: 'Trip TRP-002',
    entityId: 'TRP-002',
    user: 'Manager',
    userId: 'EMP-003',
    timestamp: new Date('2024-01-13T15:45:00Z'),
    details: 'Daily trip created for Ali Ahmed with 25 products'
  },
  {
    id: '8',
    action: 'Updated',
    entity: 'Product',
    entityName: 'Mango',
    entityId: 'PRD-003',
    user: 'Manager',
    userId: 'EMP-003',
    timestamp: new Date('2024-01-13T13:20:00Z'),
    details: 'Product category changed from fresh to bakery'
  }
];

const getActionColor = (action: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
  switch (action.toLowerCase()) {
    case 'created': {
      return 'success';
    }
    case 'updated': {
      return 'primary';
    }
    case 'deleted': {
      return 'error';
    }
    default: {
      return 'info';
    }
  }
};

export default function Page(): React.JSX.Element {
  const { user } = useUser();

  // Only show for super admin
  if (!user?.roles?.includes('super_admin')) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You don&apos;t have permission to view this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          title="System Activity Log"
          subheader="Track all system activities and changes"
        />
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockActivities.map((activity) => (
                <TableRow key={activity.id} hover>
                  <TableCell>
                    <Chip
                      label={activity.action}
                      color={getActionColor(activity.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.entityName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.entity} ({activity.entityId})
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {activity.details}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {activity.user}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {activity.timestamp.toLocaleDateString()} {activity.timestamp.toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
