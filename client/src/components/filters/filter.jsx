import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

// Reusable style
const selectStyles = {
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
};

export function CategorySelect({ value, onChange }) {
  const categories = ['Electronics', 'Fashion', 'Home Appliances', 'Books'];

  return (
    <FormControl size="small" sx={{ minWidth: 160, ...selectStyles }}>
      <InputLabel id="category-label">Category</InputLabel>
      <Select
        labelId="category-label"
        value={value}
        label="Category"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        {categories.map((cat, index) => (
          <MenuItem key={index} value={cat}>{cat}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function PriceSelect({ value, onChange }) {
  const prices = ['Under $50', '$50 - $100', '$100 - $200', 'Above $200'];

  return (
    <FormControl size="small" sx={{ minWidth: 160, ...selectStyles }}>
      <InputLabel id="price-label">Price</InputLabel>
      <Select
        labelId="price-label"
        value={value}
        label="Price"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        {prices.map((price, index) => (
          <MenuItem key={index} value={price}>{price}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function RatingSelect({ value, onChange }) {
  const ratings = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];

  return (
    <FormControl size="small" sx={{ minWidth: 160, ...selectStyles }}>
      <InputLabel id="rating-label">Rating</InputLabel>
      <Select
        labelId="rating-label"
        value={value}
        label="Rating"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        {ratings.map((rating, index) => (
          <MenuItem key={index} value={rating}>{rating}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function SortBySelect({ value, onChange }) {
  const sortOptions = [
    'Price: Low to High',
    'Price: High to Low',
    'Rating: High to Low',
    'Rating: Low to High'
  ];

  return (
    <FormControl size="small" sx={{ minWidth: 160, ...selectStyles }}>
      <InputLabel id="sort-label">Sort By</InputLabel>
      <Select
        labelId="sort-label"
        value={value}
        label="Sort By"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value=""><em>None</em></MenuItem>
        {sortOptions.map((option, index) => (
          <MenuItem key={index} value={option}>{option}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
