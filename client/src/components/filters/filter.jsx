import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export function CategorySelect() {
  const [category, setCategory] = React.useState('');
  const categories = ['Electronics', 'Fashion', 'Home Appliances', 'Books'];

  const handleChange = (event) => {
    setCategory(event.target.value);
  };

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: 160,
        '& .MuiInputLabel-root': { color: '#6b7280' }, // Tailwind gray-500
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          '& fieldset': {
            borderColor: '#d1d5db', // Tailwind gray-300
          },
          '&:hover fieldset': {
            borderColor: '#9ca3af', // Tailwind gray-400
          },
          '&.Mui-focused fieldset': {
            borderColor: '#3b82f6', // Tailwind blue-500
          },
        },
      }}
    >
      <InputLabel id="category-label">Category</InputLabel>
      <Select
        labelId="category-label"
        value={category}
        label="Category"
        onChange={handleChange}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {categories.map((cat, index) => (
          <MenuItem key={index} value={cat}>
            {cat}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function PriceSelect() {
  const [selectPrice, setSelectPrice] = React.useState('');
  const prices = ['Under $50', '$50 - $100', '$100 - $200', 'Above $200'];

  const handleChange = (event) => {
    setSelectPrice(event.target.value);
  };

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: 160,
        '& .MuiInputLabel-root': { color: '#6b7280' },
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          '& fieldset': {
            borderColor: '#d1d5db',
          },
          '&:hover fieldset': {
            borderColor: '#9ca3af',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#3b82f6',
          },
        },
      }}
    >
      <InputLabel id="price-label">Price</InputLabel>
      <Select
        labelId="price-label"
        value={selectPrice}
        label="Price"
        onChange={handleChange}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {prices.map((price, index) => (
          <MenuItem key={index} value={price}>
            {price}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
