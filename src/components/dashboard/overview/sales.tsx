'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { MenuItem, FormControl, InputLabel, TextField, Box } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import type { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';

import { Chart } from '@/components/core/chart';
import type { DailyTrip } from '@/contexts/daily-trip-context';
import type { Employee } from '@/contexts/employee-context';

export interface SalesProps {
  trips: DailyTrip[];
  drivers: Employee[];
  sx?: SxProps;
}

export function Sales({ trips, drivers, sx }: SalesProps): React.JSX.Element {
  // State for filters
  const [metricType, setMetricType] = React.useState<string>('Profit');

  // Default yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedYesterday = yesterday.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = React.useState<string>(formattedYesterday);

  // Calculate driver metrics based on selected date and metric type
  const driverMetrics = React.useMemo(() => {
    const selectedDateObj = dayjs(selectedDate);
    
    // Filter trips for the selected date
    const filteredTrips = trips.filter(trip => {
      const tripDate = dayjs(trip.date);
      return tripDate.isSame(selectedDateObj, 'day');
    });

    // Calculate metrics for each driver
    const metrics = drivers.map(driver => {
      const driverTrips = filteredTrips.filter(trip => trip.driverId === driver.id);
      
      const totals = driverTrips.reduce((acc, trip) => ({
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

      // Add driver balance if it's a balance metric
      if (metricType === 'Balance') {
        totals.balance += driver.balance || 0;
      }

      return {
        driverName: driver.name,
        ...totals
      };
    });

    return metrics;
  }, [trips, drivers, selectedDate, metricType]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const driverNames = driverMetrics.map(metric => metric.driverName);
    const values = driverMetrics.map(metric => {
      switch (metricType) {
        case 'Profit': {
          return metric.profit;
        }
        case 'Cash Collection': {
          return metric.collectionAmount;
        }
        case 'Purchase Amount': {
          return metric.purchaseAmount;
        }
        case 'Discount': {
          return metric.discount;
        }
        case 'Amount to be': {
          return metric.amountToBe;
        }
        case 'Petrol': {
          return metric.petrol;
        }
        case 'Balance': {
          return metric.balance;
        }
        case 'Expiry': {
          return metric.expiry;
        }
        default: {
          return 0;
        }
      }
    });

    return {
      series: [{ name: metricType, data: values }],
      categories: driverNames
    };
  }, [driverMetrics, metricType]);

  const chartOptions = useChartOptions(chartData.categories);

  const handleMetricChange = (event: SelectChangeEvent<string>) => {
    setMetricType(event.target.value);
  };

  // const handleDriverChange = (event: SelectChangeEvent<string>) => {
  //   setSelectedDriver(event.target.value as string);
  // }; // Unused

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  return (
    <Card sx={sx}>
      <CardHeader
        title="Metrics"
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Metric Type Dropdown */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="metric-select-label">Metric</InputLabel>
              <Select
                labelId="metric-select-label"
                value={metricType}
                label="Metric"
                onChange={handleMetricChange}
              >
                {/* <MenuItem value="Drivers">Drivers</MenuItem> */}
                <MenuItem value="Profit">Profit</MenuItem>
                <MenuItem value="Cash Collection">Cash Collection</MenuItem>
                <MenuItem value="Purchase Amount">Purchase Amount</MenuItem>
                <MenuItem value="Discount">Discount</MenuItem>
                <MenuItem value="Amount to be">Amount to be</MenuItem>
                <MenuItem value="Petrol">Petrol</MenuItem>
                <MenuItem value="Balance">Balance</MenuItem>
                <MenuItem value="Expiry">Expiry</MenuItem>
              </Select>
            </FormControl>

            {/* Conditional Driver Dropdown */}
            {/* {metricType === 'Drivers' && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id="driver-select-label">Driver</InputLabel>
                <Select
                  labelId="driver-select-label"
                  value={selectedDriver}
                  label="Driver"
                  onChange={handleDriverChange}
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver} value={driver}>
                      {driver}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )} */}

            {/* Date Picker */}
            <TextField
              size="small"
              type="date"
              label="Date"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          </Box>
        }
      />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartData.series} type="bar" width="100%" />
      </CardContent>
      <Divider />
    </Card>
  );
}

function useChartOptions(categories: string[]): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', stacked: false, toolbar: { show: false } },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    fill: { opacity: 1, type: 'solid' },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { show: false },
    plotOptions: { bar: { columnWidth: '40px' } },
    stroke: { colors: ['transparent'], show: true, width: 2 },
    theme: { mode: theme.palette.mode },
    tooltip: { 
      enabled: true,
      y: {
        formatter: (value) => `${value.toFixed(0)}`
      }
    },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      categories: categories,
      labels: { 
        offsetY: 5, 
        style: { colors: theme.palette.text.secondary },
        rotate: -45,
        maxHeight: 60
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${value.toFixed(0)}`,
        offsetX: -10,
        style: { colors: theme.palette.text.secondary },
      },
    },
  };
}
