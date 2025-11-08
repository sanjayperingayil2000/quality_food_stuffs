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

export interface EnrichedActivity extends Activity {
  entityName?: string; // populated entity name
}

// ---------- Helpers ----------
const getActionColor = (
  action: string
): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
  const actionLower = action.toLowerCase();
  
  // Handle various possible action values
  if (actionLower === 'create' || actionLower === 'created') {
    return 'success'; // Green
  }
  if (actionLower === 'update' || actionLower === 'updated') {
    return 'primary'; // Blue
  }
  if (actionLower === 'delete' || actionLower === 'deleted') {
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
    if (key === 'updatedAt') {
      continue;
    }
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

const getActionDescription = (activity: EnrichedActivity): string => {
  const { action, collectionName, before, after } = activity;
  const actionLower = action.toLowerCase();
  const isUpdateAction = actionLower === 'update' || actionLower === 'updated';

  if (isUpdateAction) {
    const changedFields = before && after ? getChangedFields(before, after) : [];
    const uniqueFields = [...new Set(changedFields)];
    const formattedFields = uniqueFields.map(field => formatFieldName(field));
    return formattedFields.length > 0
      ? `Updated fields: ${formattedFields.join(', ')}`
      : 'Updated fields: (no changes detected)';
  }
  
  // Use enriched entity name or fallback to snapshot data
  const entityName = activity.entityName || 'Unknown Entity';

  switch (collectionName) {
    case 'employees': {
      switch (actionLower) {
        case 'created': {
          return `Employee "${entityName}" added on employee page`;
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

// ---------- Helper Function to Extract Entity Name from History Snapshots ----------
const extractEntityName = (
  activity: Activity
): string => {
  const { collectionName, before, after } = activity;
  
  // Try to extract name from the snapshot data
  // For 'create' actions, use 'after'
  // For 'delete' actions, use 'before'
  // For 'update' actions, prefer 'after' (current state)
  const snapshot = after || before;
  
  if (!snapshot) {
    return 'Unknown Entity';
  }

  try {
    switch (collectionName) {
      case 'employees': {
        return (snapshot as { name?: string }).name || 'Unknown Employee';
      }
      case 'products': {
        return (snapshot as { name?: string }).name || 'Unknown Product';
      }
      case 'additional_expenses': {
        return (snapshot as { driverName?: string }).driverName || 'Unknown Employee';
      }
      case 'daily_trips': {
        return (snapshot as { driverName?: string }).driverName || 'Unknown Employee';
      }
      case 'dailyTrips': {
        return (snapshot as { driverName?: string }).driverName || 'Unknown Employee';
      }
      case 'additionalExpenses': {
        return (snapshot as { driverName?: string }).driverName || 'Unknown Employee';
      }
      default: {
        return 'Unknown Entity';
      }
    }
  } catch (error) {
    console.error(`Failed to extract entity name for ${collectionName}:`, error);
    return 'Unknown Entity';
  }
};

// ---------- Component ----------
export default function Page(): React.JSX.Element {
  const { user } = useUser();
  const [activities, setActivities] = React.useState<EnrichedActivity[]>([]);
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

        // Enrich activities with entity names from stored snapshots
        const enriched: EnrichedActivity[] = mapped.map((activity) => {
          const entityName = extractEntityName(activity);
          return { ...activity, entityName };
        });

        setActivities(enriched);
      } catch (error) {
        console.error('Failed to load histories', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch after user is known (prevents 401 before token is ready)
    if (user && user.roles?.includes('super_admin')) {
      fetchActivities();
    }
  }, [user]);

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
                      <TableCell>{activity.actor || 'System'}</TableCell>
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
