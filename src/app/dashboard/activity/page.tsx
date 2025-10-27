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
import CircularProgress from '@mui/material/CircularProgress';
import { useUser } from '@/hooks/use-user';
import { apiClient } from '@/lib/api-client';

// ---------- Types ----------
interface Snapshot {
  name?: string;
  id?: string;
  balance?: number;
  price?: number;
  date?: string | Date;
  driverName?: string;
  category?: string;
  [key: string]: unknown;
}

export interface Activity {
  _id: string;
  action: string;
  collectionName: string;
  documentId?: string;
  before?: Snapshot;
  after?: Snapshot;
  actor?: string; // populated actor name
  timestamp: string;
}

// ---------- Helpers ----------
const getActionColor = (
  action: string
): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
  const actionLower = action.toLowerCase();
  
  // Handle various possible action values
  if (actionLower.includes('create') || actionLower === 'create') {
    return 'success'; // Green
  }
  if (actionLower.includes('update') || actionLower === 'update') {
    return 'primary'; // Blue
  }
  if (actionLower.includes('delete') || actionLower === 'delete') {
    return 'error'; // Red
  }
  
  // Default fallback
  return 'info';
};

// Function to compare objects and get changed fields
const getChangedFields = (before: Snapshot, after: Snapshot): string[] => {
  const changedFields: string[] = [];
  
  if (!before || !after) return changedFields;
  
  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    // Compare values, handling nested objects
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
};

// Function to format field names for display
const formatFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    'phoneNumber': 'phone number',
    'routeName': 'route',
    'salary': 'salary',
    'balance': 'balance',
    'location': 'location',
    'address': 'address',
    'designation': 'role',
    'isActive': 'status',
    'price': 'price',
    'name': 'name',
    'email': 'email',
    'quantity': 'quantity',
    'products': 'products',
    'collectionAmount': 'collection amount',
    'purchaseAmount': 'purchase amount',
    'discount': 'discount',
    'petrol': 'petrol',
    'expiry': 'expiry',
    'transfer': 'product transfer',
    'title': 'title',
    'category': 'category',
    'amount': 'amount',
    'status': 'status',
    'date': 'date',
  };
  
  return fieldMap[fieldName] || fieldName;
};

const getActionDescription = (activity: Activity): string => {
  const { action, collectionName, before, after, documentId } = activity;
  const actionLower = action.toLowerCase();
  
  // Get entity name from after, before, or documentId
  const entityName = after?.name || before?.name || documentId || 'Unknown';
  
  switch (collectionName) {
    case 'employees': {
      switch (actionLower) {
        case 'created': {
          return `Employee "${entityName}" added on employee page`;
        }
        case 'updated': {
          if (before && after) {
            const changedFields = getChangedFields(before, after);
            if (changedFields.length > 0) {
              const fieldNames = changedFields.map(f => formatFieldName(f)).join(', ');
              return `Update on ${fieldNames} of ${entityName} on employee page`;
            }
          }
          return `Employee "${entityName}" details updated on employee page`;
        }
        case 'deleted': {
          return `Employee "${entityName}" deleted from employee page`;
        }
        default: {
          return `${action} ${entityName} employee`;
        }
      }
    }
      
    case 'products': {
      const productName = entityName;
      switch (actionLower) {
        case 'created': {
          return `Product "${productName}" added on product page`;
        }
        case 'updated': {
          if (before && after) {
            const changedFields = getChangedFields(before, after);
            if (changedFields.length > 0) {
              const fieldNames = changedFields.map(f => formatFieldName(f)).join(', ');
              return `Update on ${fieldNames} field for product "${productName}" on product page`;
            }
          }
          return `Product "${productName}" details updated on product page`;
        }
        case 'deleted': {
          return `Product "${productName}" deleted from product page`;
        }
        default: {
          return `${action} ${productName} product`;
        }
      }
    }
      
    case 'dailyTrips':
    case 'daily_trips': {
      const driverName = entityName;
      let tripDate = 'selected date';
      try {
        if (after?.date) {
          tripDate = new Date(after.date).toLocaleDateString();
        } else if (before?.date) {
          tripDate = new Date(before.date).toLocaleDateString();
        }
      } catch {
        // Invalid date, use default
      }
      
      switch (actionLower) {
        case 'created': {
          return `Daily trip for ${driverName} created on daily trip page`;
        }
        case 'updated': {
          if (before && after) {
            const changedFields = getChangedFields(before, after);
            const relevantFields = changedFields.filter(f => 
              ['quantity', 'products', 'collectionAmount', 'purchaseAmount', 
               'discount', 'petrol', 'expiry', 'transfer', 'acceptedProducts'].includes(f)
            );
            
            if (relevantFields.length > 0) {
              let fieldDescription = 'quantity and financial information';
              if (relevantFields.includes('transfer') || relevantFields.includes('acceptedProducts')) {
                fieldDescription = 'quantity, financial information or product transfer';
              }
              return `Update on ${fieldDescription} field of ${driverName} for day ${tripDate} on daily trip page`;
            }
          }
          return `Daily trip for ${driverName} on ${tripDate} updated on daily trip page`;
        }
        case 'deleted': {
          return `Daily trip for ${driverName} on ${tripDate} deleted from daily trip page`;
        }
        default: {
          return `${action} daily trip for ${driverName}`;
        }
      }
    }
      
    case 'additionalExpenses':
    case 'additional_expenses': {
      const expenseData = after || before;
      const driverName = expenseData?.driverName || expenseData?.name || entityName;
      
      switch (actionLower) {
        case 'created': {
          const category = expenseData?.category || 'additional';
          return `${driverName} ${category} expense added on additional expense page`;
        }
        case 'updated': {
          if (before && after) {
            const changedFields = getChangedFields(before, after);
            if (changedFields.length > 0) {
              const fieldNames = changedFields.map(f => formatFieldName(f)).join(', ');
              return `Update on ${fieldNames} for ${driverName} on additional expense page`;
            }
          }
          return `${driverName} additional expense updated on additional expense page`;
        }
        case 'deleted': {
          return `${driverName} additional expense deleted from additional expense page`;
        }
        default: {
          return `${action} ${driverName} additional expense`;
        }
      }
    }
      
    default: {
      switch (actionLower) {
        case 'created': {
          return `${entityName} added on ${collectionName} page`;
        }
        case 'updated': {
          return `${entityName} updated on ${collectionName} page`;
        }
        case 'deleted': {
          return `${entityName} deleted from ${collectionName} page`;
        }
        default: {
          return `${action} ${entityName} on ${collectionName}`;
        }
      }
    }
  }
};

// ---------- Component ----------
export default function Page(): React.JSX.Element {
  const { user } = useUser();
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await apiClient.getHistory<Activity>();
        if (res.error) throw new Error(res.error);

        // Ensure proper type mapping
        const mapped: Activity[] = (res.data?.items || []).map(item => ({
          ...item,
          actor: item.actor || 'Unknown',
        }));

        setActivities(mapped);
      } catch (error) {
        console.error('Failed to load histories', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Access control
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map(activity => {
                  const actionDescription = getActionDescription(activity);

                  return (
                    <TableRow key={activity._id} hover>
                      <TableCell>
                        <Chip
                          label={activity.action}
                          color={getActionColor(activity.action)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {actionDescription}
                        </Typography>
                      </TableCell>
                      <TableCell>{activity.actor || 'Satheesh Thalekkara'}</TableCell>
                      <TableCell>
                        {new Date(activity.timestamp).toLocaleDateString()}{' '}
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
