'use client';

import * as React from 'react';
// import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { MenuItem, FormControl, InputLabel, TextField, Box } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import type { ApexOptions } from 'apexcharts';

import { Chart } from '@/components/core/chart';

export interface SalesProps {
  chartSeries: { name: string; data: number[] }[];
  drivers?: string[];
  sx?: SxProps;
}

export function Sales({ chartSeries, drivers: _drivers = ['John', 'Mike', 'Sara'], sx }: SalesProps): React.JSX.Element {
  const chartOptions = useChartOptions();

  // State for filters
  const [metricType, setMetricType] = React.useState<'Drivers' | 'Profit'>('Drivers');

  // Default yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const formattedYesterday = yesterday.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = React.useState<string>(formattedYesterday);


  const handleMetricChange = (event: SelectChangeEvent<string>) => {
    setMetricType(event.target.value as 'Drivers' | 'Profit');
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
                <MenuItem value="Drivers">Drivers</MenuItem>
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
        <Chart height={350} options={chartOptions} series={chartSeries} type="bar" width="100%" />
      </CardContent>
      <Divider />
    </Card>
  );
}

function useChartOptions(): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', stacked: false, toolbar: { show: false } },
    colors: [theme.palette.primary.main],   // ✅ only one color (dark blue)
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
    tooltip: { enabled: false },
    // states: {
    //   hover: { filter: { type: 'none' } },
    //   active: { filter: { type: 'none' } },
    // },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { offsetY: 5, style: { colors: theme.palette.text.secondary } },
    },
    yaxis: {
      labels: {
        formatter: (value) => (value > 0 ? `${value}K` : `${value}`),
        offsetX: -10,
        style: { colors: theme.palette.text.secondary },
      },
    },
  };
}
