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
import { useEmployees } from '@/contexts/employee-context';
import { useProducts } from '@/contexts/product-context';

// ---------- Types ----------
interface Snapshot {
  name?: string;
  id?: string;
  balance?: number;
  price?: number;
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

const getActionDescription = (activity: EnrichedActivity): string => {
  const { action, collectionName, before, after } = activity;
  const actionLower = action.toLowerCase();
  
  // Use enriched entity name or fallback to snapshot data
  const entityName = activity.entityName || after?.name || before?.name || after?.title || before?.title || 'Unknown Entity';
  
  
  switch (collectionName) {
    case 'employees': {
      switch (actionLower) {
        case 'created': {
          return `${entityName} named employee added`;
        }
        case 'updated': {
          if (before && after) {
            // Check for specific field changes
            if (before.balance !== after.balance) {
              return `${entityName} employee balance updated from ${before.balance || 0} to ${after.balance || 0}`;
            }
            if (before.name !== after.name) {
              return `${before.name || 'Employee'} name changed to ${after.name || 'Unknown'}`;
            }
            if (before.salary !== after.salary) {
              return `${entityName} salary updated from ${before.salary || 0} to ${after.salary || 0}`;
            }
            return `${entityName} employee details updated`;
          }
          return `${entityName} employee updated`;
        }
        case 'deleted': {
          return `${entityName} named employee has been deleted`;
        }
        default: {
          return `${action} ${entityName} employee`;
        }
      }
    }
      
    case 'products': {
      switch (actionLower) {
        case 'created': {
          return `${entityName} named product added`;
        }
        case 'updated': {
          if (before && after) {
            // Check for price changes
            if (before.price !== after.price) {
              return `${entityName} product unit price updated from ${before.price || 0} to ${after.price || 0}`;
            }
            if (before.name !== after.name) {
              return `${before.name || 'Product'} name changed to ${after.name || 'Unknown'}`;
            }
            if (before.category !== after.category) {
              return `${entityName} product category changed from ${before.category || 'Unknown'} to ${after.category || 'Unknown'}`;
            }
            return `${entityName} product details updated`;
          }
          return `${entityName} product updated`;
        }
        case 'deleted': {
          return `${entityName} product has been deleted`;
        }
        default: {
          return `${action} ${entityName} product`;
        }
      }
    }
      
    case 'daily_trips': {
      switch (actionLower) {
        case 'created': {
          return `${entityName} daily trip added`;
        }
        case 'updated': {
          if (before && after) {
            return `${entityName} daily trip (quantity and financial details) updated`;
          }
          return `${entityName} daily trip updated`;
        }
        case 'deleted': {
          return `${entityName} daily trip has been deleted`;
        }
        default: {
          return `${action} ${entityName} daily trip`;
        }
      }
    }
      
    case 'additional_expenses': {
      // Try to get expense details from before/after snapshots
      const expenseData = after || before;
      const driverName = expenseData?.driverName || expenseData?.name || 'Unknown Employee';
      const expenseType = expenseData?.category || expenseData?.type || 'expense';
      
      switch (actionLower) {
        case 'created': {
          return `${driverName} ${expenseType} expense added`;
        }
        case 'updated': {
          return `${driverName} ${expenseType} expense updated`;
        }
        case 'deleted': {
          return `${driverName} ${expenseType} expense has been deleted`;
        }
        default: {
          return `${action} ${driverName} ${expenseType} expense`;
        }
      }
    }
      
    default: {
      switch (actionLower) {
        case 'created': {
          return `${entityName} named ${collectionName} added`;
        }
        case 'updated': {
          return `${entityName} ${collectionName} updated`;
        }
        case 'deleted': {
          return `${entityName} ${collectionName} has been deleted`;
        }
        default: {
          return `${action} ${entityName} ${collectionName}`;
        }
      }
    }
  }
};

// ---------- Helper Function to Fetch Entity Names ----------
const fetchEntityName = async (
  collectionName: string,
  documentId: string | undefined,
  employees: any[],
  products: any[]
): Promise<string> => {
  if (!documentId) return 'Unknown Entity';

  try {
    switch (collectionName) {
      case 'employees': {
        const employee = employees.find(emp => emp.id === documentId);
        return employee?.name || 'Unknown Employee';
      }
      case 'products': {
        const product = products.find(prod => prod.id === documentId);
        return product?.name || 'Unknown Product';
      }
      case 'additional_expenses': {
        const expense = await apiClient.getAdditionalExpense(documentId);
        if (expense.data?.expense) {
          return expense.data.expense.title || expense.data.expense.driverName || 'Expense';
        }
        return 'Unknown Expense';
      }
      case 'daily_trips': {
        const trip = await apiClient.getDailyTrip(documentId);
        if (trip.data?.trip) {
          return `${trip.data.trip.driverName || 'Unknown Driver'}'s trip on ${new Date(trip.data.trip.date).toLocaleDateString()}`;
        }
        return 'Unknown Trip';
      }
      default:
        return documentId;
    }
  } catch (error) {
    console.error(`Failed to fetch entity name for ${collectionName}:`, error);
    return documentId;
  }
};

// ---------- Component ----------
export default function Page(): React.JSX.Element {
  const { user } = useUser();
  const { employees } = useEmployees();
  const { products } = useProducts();
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

        // Enrich activities with entity names
        const enriched: EnrichedActivity[] = await Promise.all(
          mapped.map(async (activity) => {
            const entityName = await fetchEntityName(
              activity.collectionName,
              activity.documentId,
              employees,
              products
            );
            return { ...activity, entityName };
          })
        );

        setActivities(enriched);
      } catch (error) {
        console.error('Failed to load histories', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [employees, products]);

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
