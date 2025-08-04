import React, { useState } from "react";
import {
  CategorySelect,
  PriceSelect,
  RatingSelect,
  SortBySelect,
} from "../filters/filter";
import "../../styles/filters.css";

const Filters = () => {
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState("");
  const [sortBy, setSortBy] = useState("");

  const clearCategory = () => setCategory("");
  const clearPrice = () => setPrice("");
  const clearRating = () => setRating("");
  const clearSortBy = () => setSortBy("");

  const clearAll = () => {
    setCategory("");
    setPrice("");
    setRating("");
    setSortBy("");
  };

  return (
    <div className="filter-container">
      <div className="filter">
        <div className="filter1">
          <CategorySelect value={category} onChange={setCategory} />
          <PriceSelect value={price} onChange={setPrice} />
          <RatingSelect value={rating} onChange={setRating} />
        </div>
        <div className="filter2">
          <SortBySelect value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      <div className="filter-result">
        <h3>Active Filters:</h3>
        <ul>
          {category && (
            <li>
              {category}{" "}
              <button className="close-button" onClick={clearCategory}>
                x
              </button>
            </li>
          )}
          {price && (
            <li>
              {price}{" "}
              <button className="close-button" onClick={clearPrice}>
                x
              </button>
            </li>
          )}
          {rating && (
            <li>
              {rating}{" "}
              <button className="close-button" onClick={clearRating}>
                x
              </button>
            </li>
          )}
          {sortBy && (
            <li>
              {sortBy}{" "}
              <button className="close-button" onClick={clearSortBy}>
                x
              </button>
            </li>
          )}
        </ul>

        {(category || price || rating || sortBy) && (
          <button className="clear-all" onClick={clearAll}>
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default Filters;
