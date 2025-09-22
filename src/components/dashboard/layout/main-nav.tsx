'use client';

import * as React from 'react';
import {
  Avatar,
  // Badge,
  Box,
  BoxProps,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
// import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List';
// import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { FilePdfIcon, FileXlsIcon } from '@phosphor-icons/react/dist/ssr';

import { usePopover } from '@/hooks/use-popover';
import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';

export interface MainNavProps extends BoxProps { }

export function MainNav({ sx, ...props }: MainNavProps): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState(false);
  const [selection, setSelection] = React.useState('');
  const [driver, setDriver] = React.useState('');
  const [dateRange, setDateRange] = React.useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const userPopover = usePopover<HTMLDivElement>();

  const driverList = ['John Doe', 'Jane Smith', 'Michael Brown'];

  const handleSelectionChange = (event: SelectChangeEvent) => {
    setSelection(event.target.value as string);
    setDriver('');
  };

  const handleDriverChange = (event: SelectChangeEvent) => {
    setDriver(event.target.value as string);
  };

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          ...sx,
        }}
        {...props}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '75px',
            px: 2,
          }}
        >
          {/* Left side */}
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <IconButton onClick={() => setOpenNav(true)} sx={{ display: { lg: 'none' } }}>
              <ListIcon />
            </IconButton>

            {/* First dropdown */}
            <Box sx={{ minWidth: 230 }}>
              <FormControl fullWidth>
                <InputLabel id="main-select-label">Select</InputLabel>
                <Select
                  labelId="main-select-label"
                  id="main-select"
                  value={selection}
                  label="Select"
                  onChange={handleSelectionChange}
                  sx={{
                    borderRadius: '50px',
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: '50px',
                    },
                  }}
                >
                  <MenuItem value="company">Company</MenuItem>
                  <MenuItem value="driver">Driver</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Second dropdown */}
            {selection === 'driver' && (
              <Box sx={{ minWidth: 230 }}>
                <FormControl fullWidth>
                  <InputLabel id="driver-select-label">Driver</InputLabel>
                  <Select
                    labelId="driver-select-label"
                    id="driver-select"
                    value={driver}
                    label="Driver"
                    onChange={handleDriverChange}
                    sx={{
                      borderRadius: '50px',
                      backgroundColor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '50px',
                      },
                    }}
                  >
                    {driverList.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Date pickers */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="From"
                value={dateRange[0]}
                onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                slotProps={{
                  textField: {
                    sx: {
                      borderRadius: '50px',
                      backgroundColor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '50px',
                      },
                    },
                  },
                }}
              />
              <DatePicker
                label="To"
                value={dateRange[1]}
                onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                slotProps={{
                  textField: {
                    sx: {
                      borderRadius: '50px',
                      backgroundColor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '50px',
                      },
                    },
                  },
                }}
              />
            </Box>

            <Button variant="contained">Apply</Button>
          </Stack>

          {/* Right side */}
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <Tooltip title="Download Report Pdf">
              <IconButton>
                <FilePdfIcon size={32} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Report Excel">
              <IconButton>
                <FileXlsIcon size={32} />
              </IconButton>
            </Tooltip>
            <Avatar
              onClick={userPopover.handleOpen}
              ref={userPopover.anchorRef}
              src="/assets/avatar.png"
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* Popovers + Mobile nav */}
      <UserPopover
        anchorEl={userPopover.anchorRef.current}
        onClose={userPopover.handleClose}
        open={userPopover.open}
      />
      <MobileNav onClose={() => setOpenNav(false)} open={openNav} />
    </React.Fragment>
  );
}

export function MainNavWrapper() {
  return (
    <MainNav
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: 'background.paper',
        width: '100%',
        transition: 'all 0.3s ease',
        mb: 2,
        pb: 2,
      }}
    />
  );
}