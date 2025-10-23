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

const getActionDescription = (activity: Activity): string => {
  const { action, collectionName, before, after, documentId } = activity;
  const actionLower = action.toLowerCase();
  
  // Get entity name from after, before, or documentId
  const entityName = after?.name || before?.name || documentId || 'Unknown';
  
  switch (collectionName) {
    case 'employees': {
      switch (actionLower) {
        case 'created': {
          return `Added new employee "${entityName}"`;
        }
        case 'updated': {
          if (before && after) {
            // Check for specific field changes
            if (before.balance !== after.balance) {
              return `Updated employee "${entityName}" balance from ${before.balance || 0} to ${after.balance || 0}`;
            }
            return `Updated employee "${entityName}" details`;
          }
          return `Updated employee "${entityName}"`;
        }
        case 'deleted': {
          return `Deleted employee "${entityName}"`;
        }
        default: {
          return `${action} employee "${entityName}"`;
        }
      }
    }
      
    case 'products': {
      switch (actionLower) {
        case 'created': {
          return `Added new product "${entityName}"`;
        }
        case 'updated': {
          if (before && after) {
            // Check for price changes
            if (before.price !== after.price) {
              return `Updated product "${entityName}" price from ${before.price || 0} to ${after.price || 0}`;
            }
            return `Updated product "${entityName}" details`;
          }
          return `Updated product "${entityName}"`;
        }
        case 'deleted': {
          return `Deleted product "${entityName}"`;
        }
        default: {
          return `${action} product "${entityName}"`;
        }
      }
    }
      
    case 'daily_trips': {
      switch (actionLower) {
        case 'created': {
          return `Created new trip for driver "${entityName}"`;
        }
        case 'updated': {
          if (before && after) {
            return `Updated trip for driver "${entityName}" - quantity and purchase amount modified`;
          }
          return `Updated trip for driver "${entityName}"`;
        }
        case 'deleted': {
          return `Deleted trip for driver "${entityName}"`;
        }
        default: {
          return `${action} trip for driver "${entityName}"`;
        }
      }
    }
      
    default: {
      switch (actionLower) {
        case 'created': {
          return `Created new ${collectionName} "${entityName}"`;
        }
        case 'updated': {
          return `Updated ${collectionName} "${entityName}"`;
        }
        case 'deleted': {
          return `Deleted ${collectionName} "${entityName}"`;
        }
        default: {
          return `${action} ${collectionName} "${entityName}"`;
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
                        <Box>
                          <Chip
                            label={activity.action}
                            color={getActionColor(activity.action)}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {actionDescription}
                          </Typography>
                        </Box>
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
