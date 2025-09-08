from __future__ import annotations
from datetime import date

def overlap_days(a_start: date, a_end: date, b_start: date, b_end: date) -> int:
    """
    Calculates inclusive-overlap-in-days for [a_start, a_end] and [b_start, b_end].
    Days are counted as civil days (midnight boundaries). Returns >= 0.
    """
    start = max(a_start, b_start)
    end = min(a_end, b_end)
    if end < start:
        return 0
    return (end - start).days + 1

def days_inclusive(start: date, end: date) -> int:
    return (end - start).days + 1
