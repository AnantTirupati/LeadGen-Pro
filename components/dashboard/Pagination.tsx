'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  pageSize?: number;
  totalLoaded: number;
  hasMore: boolean;
  isLoadingMore?: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  pageSize = 20,
  totalLoaded,
  hasMore,
  isLoadingMore = false,
  onPageChange,
}: PaginationProps) {
  if (totalLoaded === 0) {
    return null;
  }

  const loadedPages = Math.max(1, Math.ceil(totalLoaded / pageSize));
  // If hasMore is true, there is at least one more page available to fetch
  const maxSelectablePage = hasMore ? loadedPages + 1 : loadedPages;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalLoaded);

  // Generate page numbers to display
  const pageNumbers: number[] = [];
  for (let p = 1; p <= maxSelectablePage; p++) {
    pageNumbers.push(p);
  }

  const handlePrev = () => {
    if (currentPage > 1 && !isLoadingMore) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if ((hasMore || currentPage < loadedPages) && !isLoadingMore) {
      onPageChange(currentPage + 1);
    }
  };

  const isNextDisabled = (!hasMore && currentPage >= loadedPages) || isLoadingMore;
  const isPrevDisabled = currentPage === 1 || isLoadingMore;

  return (
    <div
      className="neo-card"
      style={{
        marginTop: '2rem',
        padding: '1.25rem 1.5rem',
        border: '2px solid #000',
        boxShadow: '4px 4px 0px 0px #000',
        background: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      {/* Showing item range text */}
      <div style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>
        {hasMore ? (
          <span>
            Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalLoaded}+</strong> leads
          </span>
        ) : (
          <span>
            Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalLoaded}</strong> leads
          </span>
        )}
      </div>

      {/* Pagination controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isPrevDisabled}
          className="btn btn--secondary btn--sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            opacity: isPrevDisabled ? 0.5 : 1,
            cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        {/* Page Number Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {pageNumbers.map((pageNum) => {
            const isActive = pageNum === currentPage;
            const isUnfetched = pageNum > loadedPages;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => !isLoadingMore && onPageChange(pageNum)}
                disabled={isLoadingMore && pageNum !== currentPage}
                className={`btn btn--sm ${isActive ? 'btn--primary' : 'btn--secondary'}`}
                style={{
                  minWidth: '36px',
                  height: '34px',
                  padding: '0 0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? '2px solid #000' : '1.5px solid #000',
                  boxShadow: isActive ? '2px 2px 0px 0px #000' : 'none',
                  background: isActive ? 'var(--primary, #ffe17c)' : undefined,
                  opacity: isLoadingMore && !isActive ? 0.6 : 1,
                  cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                }}
                title={isUnfetched ? `Fetch Page ${pageNum} from Google Places` : `Go to Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className="btn btn--secondary btn--sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            opacity: isNextDisabled ? 0.5 : 1,
            cursor: isNextDisabled ? 'not-allowed' : 'pointer',
          }}
          aria-label="Next page"
        >
          {isLoadingMore ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
