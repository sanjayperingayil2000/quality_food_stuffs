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
                  <TableCell>Entity</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map(activity => {
                  const entityName =
                    activity.after?.name ?? activity.before?.name ?? '-';
                  const entityId = activity.documentId ?? activity.before?.id ?? '-';
                  const details =
                    activity.action.toLowerCase() === 'delete'
                      ? `Deleted ${entityName}`
                      : activity.before && activity.after
                        ? `Updated ${entityName}`
                        : `Created ${entityName}`;

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
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {entityName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.collectionName} ({entityId})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{details}</TableCell>
                      <TableCell>{activity.actor}</TableCell>
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
