'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { usePopover } from '@/hooks/use-popover';

import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs';
import { FilePdfIcon, FileXlsIcon } from '@phosphor-icons/react/dist/ssr';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);

  const [selection, setSelection] = React.useState('');
  const [driver, setDriver] = React.useState('');

  const [dateRange, setDateRange] = React.useState<[Dayjs | null, Dayjs | null]>([dayjs().subtract(7, 'day'), dayjs()]);

  const handleSelectionChange = (event: SelectChangeEvent) => {
    setSelection(event.target.value as string);
    setDriver(''); // reset driver when switching back to Company
  };

  const handleDriverChange = (event: SelectChangeEvent) => {
    setDriver(event.target.value as string);
  };

  const userPopover = usePopover<HTMLDivElement>();

  // Example driver list
  const driverList = ['John Doe', 'Jane Smith', 'Michael Brown'];

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '75px', px: 2 }}
        >
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <IconButton
              onClick={(): void => {
                setOpenNav(true);
              }}
              sx={{ display: { lg: 'none' } }}
            >
              <ListIcon />
            </IconButton>

            {/* <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}> */}
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
                    borderRadius: '50px', // fully rounded like a pill
                    backgroundColor: 'white', // optional: add bg so it looks clean
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: '50px', // ensures outline is rounded
                    },
                  }}
                >
                  <MenuItem value={'company'}>Company</MenuItem>
                  <MenuItem value={'driver'}>Driver</MenuItem>
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


            <Button variant="contained">Apply Filter</Button>
          </Stack>

          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            {/* <Tooltip title="Contacts">
              <IconButton>
                <UsersIcon />
              </IconButton>
            </Tooltip> */}
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
            <Tooltip title="Notifications">
              <Badge badgeContent={4} color="success" variant="dot">
                <IconButton>
                  <BellIcon />
                </IconButton>
              </Badge>
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

      <UserPopover
        anchorEl={userPopover.anchorRef.current}
        onClose={userPopover.handleClose}
        open={userPopover.open}
      />

      <MobileNav
        onClose={() => {
          setOpenNav(false);
        }}
        open={openNav}
      />
    </React.Fragment>
  );
}
