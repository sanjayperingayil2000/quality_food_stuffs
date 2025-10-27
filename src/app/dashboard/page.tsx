'use client';

import * as React from 'react';
import Grid from '@mui/material/Grid';
import dayjs from 'dayjs';
import { Budget } from '@/components/dashboard/overview/budget';
import { Sales } from '@/components/dashboard/overview/sales';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';
import { MainNavWrapper } from '@/components/dashboard/layout/main-nav';
import { useDailyTrips } from '@/contexts/daily-trip-context';
import { useEmployees } from '@/contexts/employee-context';
import { useFilters } from '@/contexts/filter-context';

export default function Page(): React.JSX.Element {
  const { trips } = useDailyTrips();
  const { drivers } = useEmployees();
  const { filters } = useFilters();

  // Calculate overview metrics from trips and employee data
  const overviewMetrics = React.useMemo(() => {
    // Filter trips based on selected date range
    let filteredTrips = trips.filter(trip => {
      const tripDate = dayjs(trip.date);
      const fromDate = filters.dateRange[0];
      const toDate = filters.dateRange[1];
      
      if (!fromDate || !toDate) return true;
      
      return tripDate.isAfter(fromDate.subtract(1, 'day')) && tripDate.isBefore(toDate.add(1, 'day'));
    });

    // Filter trips based on driver selection
    if (filters.selection === 'driver' && filters.driver !== 'All drivers') {
      const selectedDriver = drivers.find(driver => driver.name === filters.driver);
      if (selectedDriver) {
        filteredTrips = filteredTrips.filter(trip => trip.driverId === selectedDriver.id);
      }
    }

    // Calculate totals for the filtered trips
    const totals = filteredTrips.reduce((acc, trip) => ({
      collectionAmount: acc.collectionAmount + trip.collectionAmount,
      purchaseAmount: acc.purchaseAmount + trip.purchaseAmount,
      discount: acc.discount + trip.discount,
      amountToBe: acc.amountToBe + trip.amountToBe,
      petrol: acc.petrol + trip.petrol,
      balance: acc.balance + trip.balance,
      expiry: acc.expiry + trip.expiry,
      profit: acc.profit + trip.profit,
    }), {
      collectionAmount: 0,
      purchaseAmount: 0,
      discount: 0,
      amountToBe: 0,
      petrol: 0,
      balance: 0,
      expiry: 0,
      profit: 0,
    });

    // Calculate balance based on the last trip in the date range
    let calculatedBalance = 0;
    if (filters.selection === 'driver' && filters.driver !== 'All drivers') {
      // For specific driver, get the last trip's calculated balance
      const selectedDriver = drivers.find(driver => driver.name === filters.driver);
      if (selectedDriver && filteredTrips.length > 0) {
        // Get the last trip's calculated balance
        const lastTrip = filteredTrips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        calculatedBalance = lastTrip.balance || 0;
      } else if (selectedDriver) {
        // If no trips in date range, use driver's current balance from employee data
        calculatedBalance = selectedDriver.balance || 0;
      }
    } else {
      // For company view, sum the latest calculated balance for each driver from their last trip in the range
      const driverLastTrips = new Map<string, number>();
      
      // Collect the last trip's calculated balance for each driver
      for (const trip of filteredTrips) {
        const currentBalance = driverLastTrips.get(trip.driverId);
        if (!currentBalance || trip.balance !== undefined) {
          driverLastTrips.set(trip.driverId, trip.balance);
        }
      }
      
      // Sum all driver balances
      calculatedBalance = [...driverLastTrips.values()].reduce((sum, balance) => sum + balance, 0);
    }

    return {
      collectionAmount: {
        value: totals.collectionAmount,
        diff: 0, // We'll calculate this based on previous period if needed
        trend: 'up' as 'up' | 'down'
      },
      purchaseAmount: {
        value: totals.purchaseAmount,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      },
      discount: {
        value: totals.discount,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      },
      amountToBe: {
        value: totals.amountToBe,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      },
      petrol: {
        value: totals.petrol,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      },
      balance: {
        value: calculatedBalance,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      },
      expiry: {
        value: totals.expiry,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      },
      profit: {
        value: totals.profit,
        diff: 0,
        trend: 'up' as 'up' | 'down'
      }
    };
  }, [trips, drivers, filters]);

  return (
    <> 
      <MainNavWrapper />
      <Grid container spacing={3} sx={{ pl: 2 }}>
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.collectionAmount.diff} 
            trend={overviewMetrics.collectionAmount.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.collectionAmount.value.toFixed(0)}`} 
            name="Cash Collection" 
          />
        </Grid>
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.purchaseAmount.diff} 
            trend={overviewMetrics.purchaseAmount.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.purchaseAmount.value.toFixed(0)}`} 
            name="Purchase Amount" 
          />
        </Grid>
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalCustomers diff={16} trend="down" sx={{ height: '100%' }} value="1.6k" />
      </Grid> */}
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.discount.diff} 
            trend={overviewMetrics.discount.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.discount.value.toFixed(0)}`} 
            name="Discount" 
          />
        </Grid>
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TasksProgress sx={{ height: '100%' }} value={75.5} />
      </Grid> */}
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <Budget diff={12} trend="up" sx={{ height: '100%' }} value="AED 24k" name="Profit" />
      </Grid> */}
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalProfit sx={{ height: '100%' }} value="$15k" />
      </Grid> */}

        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <Budget diff={12} trend="up" sx={{ height: '100%' }} value="AED 24k" name="Balance" />
      </Grid> */}
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalProfit sx={{ height: '100%' }} value="$15k" />
      </Grid> */}
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.amountToBe.diff} 
            trend={overviewMetrics.amountToBe.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.amountToBe.value.toFixed(0)}`} 
            name='Amount to be' 
          />
        </Grid>
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalCustomers diff={16} trend="down" sx={{ height: '100%' }} value="1.6k" />
      </Grid> */}
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.petrol.diff} 
            trend={overviewMetrics.petrol.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.petrol.value.toFixed(0)}`} 
            name='Petrol' 
          />
        </Grid>
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TasksProgress sx={{ height: '100%' }} value={75.5} />
      </Grid> */}
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.balance.diff} 
            trend={overviewMetrics.balance.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.balance.value.toFixed(0)}`} 
            name='Balance' 
          />
        </Grid>
        {/* <Grid
        size={{
          lg: 3,
          sm: 6,
          xs: 12,
        }}
      >
        <TotalProfit sx={{ height: '100%' }} value="$15k" />
      </Grid> */}
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <Budget 
            diff={overviewMetrics.expiry.diff} 
            trend={overviewMetrics.expiry.trend} 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.expiry.value.toFixed(0)}`} 
            name='Expiry' 
          />
        </Grid>
        <Grid
          size={{
            lg: 3,
            sm: 6,
            xs: 12,
          }}
        >
          <TotalProfit 
            sx={{ height: '100%' }} 
            value={`${overviewMetrics.profit.value.toFixed(0)}`} 
          />
        </Grid>
        <Grid
          size={{
            lg: 12,
            md: 12,
            sm: 12,
            xs: 12,
          }}
        >
          <Sales
            trips={trips}
            drivers={drivers}
            sx={{ height: '100%' }}
          />
        </Grid>
        {/* <Grid
        size={{
          lg: 4,
          md: 6,
          xs: 12,
        }}
      >
        <Traffic chartSeries={[63, 15, 22]} labels={['Desktop', 'Tablet', 'Phone']} sx={{ height: '100%' }} />
      </Grid> */}
        {/* <Grid
        size={{
          lg: 4,
          md: 6,
          xs: 12,
        }}
      >
        <LatestProducts
          products={[
            {
              id: 'PRD-005',
              name: 'Soja & Co. Eucalyptus',
              image: '/assets/product-5.png',
              updatedAt: dayjs().subtract(18, 'minutes').subtract(5, 'hour').toDate(),
            },
            {
              id: 'PRD-004',
              name: 'Necessaire Body Lotion',
              image: '/assets/product-4.png',
              updatedAt: dayjs().subtract(41, 'minutes').subtract(3, 'hour').toDate(),
            },
            {
              id: 'PRD-003',
              name: 'Ritual of Sakura',
              image: '/assets/product-3.png',
              updatedAt: dayjs().subtract(5, 'minutes').subtract(3, 'hour').toDate(),
            },
            {
              id: 'PRD-002',
              name: 'Lancome Rouge',
              image: '/assets/product-2.png',
              updatedAt: dayjs().subtract(23, 'minutes').subtract(2, 'hour').toDate(),
            },
            {
              id: 'PRD-001',
              name: 'Erbology Aloe Vera',
              image: '/assets/product-1.png',
              updatedAt: dayjs().subtract(10, 'minutes').toDate(),
            },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid> */}
        {/* <Grid
        size={{
          lg: 8,
          md: 12,
          xs: 12,
        }}
      >
        <LatestOrders
          orders={[
            {
              id: 'ORD-007',
              customer: { name: 'Ekaterina Tankova' },
              amount: 30.5,
              status: 'pending',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-006',
              customer: { name: 'Cao Yu' },
              amount: 25.1,
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-004',
              customer: { name: 'Alexa Richardson' },
              amount: 10.99,
              status: 'refunded',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-003',
              customer: { name: 'Anje Keizer' },
              amount: 96.43,
              status: 'pending',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-002',
              customer: { name: 'Clarke Gillebert' },
              amount: 32.54,
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
            {
              id: 'ORD-001',
              customer: { name: 'Adam Denisov' },
              amount: 16.76,
              status: 'delivered',
              createdAt: dayjs().subtract(10, 'minutes').toDate(),
            },
          ]}
          sx={{ height: '100%' }}
        />
      </Grid> */}
      </Grid>
    </>
  );
}
