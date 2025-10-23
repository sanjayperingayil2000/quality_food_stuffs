'use client';

import * as React from 'react';
import {
  Avatar,
  Box,
  BoxProps,
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
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { FilePdfIcon, FileXlsIcon } from '@phosphor-icons/react/dist/ssr';

import { usePopover } from '@/hooks/use-popover';
import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';
import { useEmployees } from '@/contexts/employee-context';
import { useFilters } from '@/contexts/filter-context';

export interface MainNavProps extends BoxProps { }

export function MainNav({ sx, ...props }: MainNavProps): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState(false);
  const { drivers } = useEmployees();
  const { filters, updateSelection, updateDriver, updateDateRange } = useFilters();

  const userPopover = usePopover<HTMLDivElement>();

  const handleSelectionChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'company' | 'driver';
    updateSelection(value);
  };

  const handleDriverChange = (event: SelectChangeEvent) => {
    updateDriver(event.target.value as string);
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
            minHeight: '95px',
            px: 2,
            py: 3, // Further increased vertical padding to prevent header cutoff
          }}
        >
          {/* Left side */}
          <Stack 
            sx={{ 
              alignItems: 'center',
              flex: 1,
              minWidth: 0, // Allow shrinking
              overflow: 'hidden'
            }} 
            direction="row" 
            spacing={1}
          >
            <IconButton onClick={() => setOpenNav(true)} sx={{ display: { lg: 'none' } }}>
              <ListIcon />
            </IconButton>

            {/* First dropdown */}
            <Box sx={{ minWidth: 180, maxWidth: 200, flex: '0 0 auto' }}>
              <FormControl fullWidth>
                <InputLabel 
                  id="main-select-label"
                  sx={{ 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'text.primary',
                    '&.Mui-focused': {
                      color: 'primary.main'
                    }
                  }}
                >
                  Select
                </InputLabel>
                <Select
                  labelId="main-select-label"
                  id="main-select"
                  value={filters.selection}
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

            {/* Second dropdown (only when Driver selected) */}
            {filters.selection === 'driver' && (
              <Box sx={{ minWidth: 180, maxWidth: 200, flex: '0 0 auto' }}>
                <FormControl fullWidth>
                  <InputLabel 
                    id="driver-select-label"
                    sx={{ 
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'text.primary',
                      '&.Mui-focused': {
                        color: 'primary.main'
                      }
                    }}
                  >
                    Driver
                  </InputLabel>
                  <Select
                    labelId="driver-select-label"
                    id="driver-select"
                    value={filters.driver}
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
                    {/* Default All drivers option */}
                    <MenuItem value="All drivers">All drivers</MenuItem>
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.name}>
                        {driver.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Date pickers */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flex: '0 0 auto',
              minWidth: 0
            }}>
              <DatePicker
                label="From"
                value={filters.dateRange[0]}
                onChange={(newValue) => updateDateRange([newValue, filters.dateRange[1]])}
                slotProps={{
                  textField: {
                    sx: {
                      borderRadius: '50px',
                      backgroundColor: 'white',
                      minWidth: 120,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '50px',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'text.primary',
                        '&.Mui-focused': {
                          color: 'primary.main'
                        }
                      },
                    },
                  },
                }}
              />
              <DatePicker
                label="To"
                value={filters.dateRange[1]}
                onChange={(newValue) => updateDateRange([filters.dateRange[0], newValue])}
                slotProps={{
                  textField: {
                    sx: {
                      borderRadius: '50px',
                      backgroundColor: 'white',
                      minWidth: 120,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderRadius: '50px',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'text.primary',
                        '&.Mui-focused': {
                          color: 'primary.main'
                        }
                      },
                    },
                  },
                }}
              />
            </Box>
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