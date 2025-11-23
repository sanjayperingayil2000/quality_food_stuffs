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
import { useUser } from '@/hooks/use-user';

export default function Page(): React.JSX.Element {
  const { trips } = useDailyTrips();
  const { drivers } = useEmployees();
  const { filters } = useFilters();
  const { user } = useUser();
  
  // Check if user is a driver
  const isDriver = user?.roles?.includes('driver') && !user?.roles?.includes('super_admin') && !user?.roles?.includes('manager');

  // Calculate overview metrics from trips and employee data
  const overviewMetrics = React.useMemo(() => {
    // Filter trips based on selected date range
    let filteredTrips = trips.filter(trip => {
      const tripDate = dayjs(trip.date);
      const fromDate = filters.dateRange[0];
      const toDate = filters.dateRange[1];
      
      if (!fromDate || !toDate) return true;
      
      // Inclusive date range filtering
      return (tripDate.isSame(fromDate, 'day') || tripDate.isAfter(fromDate)) && 
             (tripDate.isSame(toDate, 'day') || tripDate.isBefore(toDate));
    });

    // For driver users, trips are already filtered by API, but ensure we only show their trips
    if (isDriver && user?.employeeId) {
      filteredTrips = filteredTrips.filter(trip => trip.driverId === user.employeeId);
    } else if (filters.selection === 'driver' && filters.driver !== 'All drivers') {
      // Filter trips based on driver selection (for non-driver users)
      const selectedDriver = drivers.find(driver => driver.name === filters.driver);
      if (selectedDriver) {
        filteredTrips = filteredTrips.filter(trip => trip.driverId === selectedDriver.id);
      }
    }

    // Calculate totals for the filtered trips
    const baseTotals = filteredTrips.reduce((acc, trip) => ({
      collectionAmount: acc.collectionAmount + trip.collectionAmount,
      purchaseAmount: acc.purchaseAmount + trip.purchaseAmount,
      discount: acc.discount + trip.discount,
      petrol: acc.petrol + trip.petrol,
      expiry: acc.expiry + trip.expiry,
    }), {
      collectionAmount: 0,
      purchaseAmount: 0,
      discount: 0,
      petrol: 0,
      expiry: 0,
    });

    // Calculate Amount to be and Profit dynamically
    // Expiry after tax = ((expiry + 5%) - 13%)
    const expiryAfterTax = Math.floor(baseTotals.expiry * 1.05 * 0.87);
    
    // Amount to be = Purchase amount - Expiry after tax
    const amountToBe = baseTotals.purchaseAmount - expiryAfterTax;
    
    // For profit calculation, we need to calculate for each trip and sum
    const calculatedProfit = filteredTrips.reduce((sum, trip) => {
      // Calculate expiry after tax for this trip
      const tripExpiryAfterTax = Math.floor(trip.expiry * 1.05 * 0.87);
      
      // Calculate fresh and bakery totals for this trip
      const freshProductsTotal = trip.products.filter(p => p.category === 'fresh')
        .reduce((s, p) => s + (p.quantity * p.unitPrice), 0);
      const bakeryProductsTotal = trip.products.filter(p => p.category === 'bakery')
        .reduce((s, p) => s + (p.quantity * p.unitPrice), 0);
      const totalProductsValue = freshProductsTotal + bakeryProductsTotal;
      
      // Skip if no products
      if (totalProductsValue === 0) return sum;
      
      // Calculate fresh net total
      const freshNetTotal = freshProductsTotal * 0.885; // 11.5% reduction
      
      // Calculate bakery net total
      const bakeryNetTotal = bakeryProductsTotal * 0.84; // 16% reduction
      
      // Profit = (13.5% of (Net Total of fresh - Expiry after tax)) + (19.5% of net total of bakery) - Discount
      const freshProfit = (freshNetTotal - tripExpiryAfterTax) * 0.135;
      const bakeryProfit = bakeryNetTotal * 0.195;
      const tripProfit = freshProfit + bakeryProfit - trip.discount;
      
      return sum + tripProfit;
    }, 0);

    const totals = {
      ...baseTotals,
      amountToBe,
      profit: calculatedProfit,
    };

    // Calculate balance from the last trip in the date range
    const calculateDriverBalance = () => {
      if (filteredTrips.length === 0) return 0;
      
      // If a driver is selected, get the last trip's balance in the date range
      if (filters.selection === 'driver' && filters.driver !== 'All drivers') {
        const selectedDriver = drivers.find(driver => driver.name === filters.driver);
        if (!selectedDriver || filteredTrips.length === 0) return 0;
        
        // Get the last trip in the filtered date range
        const sortedTrips = [...filteredTrips]
          .filter(trip => trip.driverId === selectedDriver.id)
          .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
        
        // Return the balance from the most recent trip, or 0 if no trips
        return sortedTrips.length > 0 ? (sortedTrips[0].balance || 0) : 0;
      }
      
      // For all drivers, get each driver's last trip balance and sum them
      const driverLastBalances = new Map<string, number>();
      
      // Get the last trip balance for each driver within the filtered date range
      const sortedFilteredTrips = [...filteredTrips].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
      
      for (const trip of sortedFilteredTrips) {
        if (!driverLastBalances.has(trip.driverId)) {
          driverLastBalances.set(trip.driverId, trip.balance || 0);
        }
      }
      
      // Sum all the last balances
      return [...driverLastBalances.values()].reduce((sum, balance) => sum + balance, 0);
    };
    
    const totalDriverBalance = calculateDriverBalance();

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
        value: totalDriverBalance,
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
  }, [trips, drivers, filters, isDriver, user?.employeeId]);

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
