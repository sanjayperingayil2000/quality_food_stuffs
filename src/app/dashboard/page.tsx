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

export default function Page(): React.JSX.Element {
  const { trips } = useDailyTrips();
  const { drivers } = useEmployees();

  // Calculate overview metrics from trips and employee data
  const overviewMetrics = React.useMemo(() => {
    const today = dayjs().startOf('day');
    const thisWeek = today.subtract(7, 'days');
    const lastWeek = thisWeek.subtract(7, 'days');

    // Filter trips for this week and last week
    const thisWeekTrips = trips.filter(trip => 
      dayjs(trip.date).isAfter(thisWeek) && dayjs(trip.date).isBefore(today.add(1, 'day'))
    );
    
    const lastWeekTrips = trips.filter(trip => 
      dayjs(trip.date).isAfter(lastWeek) && dayjs(trip.date).isBefore(thisWeek.add(1, 'day'))
    );

    // Calculate totals for this week
    const thisWeekTotals = thisWeekTrips.reduce((acc, trip) => ({
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

    // Calculate totals for last week
    const lastWeekTotals = lastWeekTrips.reduce((acc, trip) => ({
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

    // Calculate total driver balance from employee data
    const totalDriverBalance = drivers.reduce((sum, driver) => sum + (driver.balance || 0), 0);

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      collectionAmount: {
        value: thisWeekTotals.collectionAmount,
        diff: calculatePercentageChange(thisWeekTotals.collectionAmount, lastWeekTotals.collectionAmount),
        trend: thisWeekTotals.collectionAmount >= lastWeekTotals.collectionAmount ? 'up' : 'down' as 'up' | 'down'
      },
      purchaseAmount: {
        value: thisWeekTotals.purchaseAmount,
        diff: calculatePercentageChange(thisWeekTotals.purchaseAmount, lastWeekTotals.purchaseAmount),
        trend: thisWeekTotals.purchaseAmount >= lastWeekTotals.purchaseAmount ? 'up' : 'down' as 'up' | 'down'
      },
      discount: {
        value: thisWeekTotals.discount,
        diff: calculatePercentageChange(thisWeekTotals.discount, lastWeekTotals.discount),
        trend: thisWeekTotals.discount >= lastWeekTotals.discount ? 'up' : 'down' as 'up' | 'down'
      },
      amountToBe: {
        value: thisWeekTotals.amountToBe,
        diff: calculatePercentageChange(thisWeekTotals.amountToBe, lastWeekTotals.amountToBe),
        trend: thisWeekTotals.amountToBe >= lastWeekTotals.amountToBe ? 'up' : 'down' as 'up' | 'down'
      },
      petrol: {
        value: thisWeekTotals.petrol,
        diff: calculatePercentageChange(thisWeekTotals.petrol, lastWeekTotals.petrol),
        trend: thisWeekTotals.petrol >= lastWeekTotals.petrol ? 'up' : 'down' as 'up' | 'down'
      },
      balance: {
        value: totalDriverBalance,
        diff: 0, // Balance is cumulative, so we don't show week-over-week change
        trend: 'up' as 'up' | 'down'
      },
      expiry: {
        value: thisWeekTotals.expiry,
        diff: calculatePercentageChange(thisWeekTotals.expiry, lastWeekTotals.expiry),
        trend: thisWeekTotals.expiry >= lastWeekTotals.expiry ? 'up' : 'down' as 'up' | 'down'
      },
      profit: {
        value: thisWeekTotals.profit,
        diff: calculatePercentageChange(thisWeekTotals.profit, lastWeekTotals.profit),
        trend: thisWeekTotals.profit >= lastWeekTotals.profit ? 'up' : 'down' as 'up' | 'down'
      }
    };
  }, [trips, drivers]);

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
            value={`AED ${overviewMetrics.collectionAmount.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.purchaseAmount.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.discount.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.amountToBe.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.petrol.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.balance.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.expiry.value.toFixed(0)}`} 
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
            value={`AED ${overviewMetrics.profit.value.toFixed(0)}`} 
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
            chartSeries={[
              { name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20] },
              // { name: 'Last year', data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13] },
            ]}
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
