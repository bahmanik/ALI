/**
 * Returns all cell indices inside the rectangle defined by two cells
 * in a flattened 2D grid.
 *
 * The grid is represented as a 1D array where indices increase
 * left-to-right and then top-to-bottom (row-major order).
 *
 * Arguments:
 * @param a - Index of the first cell (one corner of the rectangle)
 * @param b - Index of the second cell (opposite corner of the rectangle)
 * @param cols - Number of columns in the grid
 *
 * Behavior:
 * The function interprets `a` and `b` as positions in a 2D grid and
 * computes the smallest rectangle that contains both cells. It then
 * returns all indices of the cells inside that rectangle.
 *
 * Returns:
 * An array of numbers representing the indices of every cell inside
 * the rectangle (including the boundary cells).
 *
 * Example:
 * For a grid with 5 columns:
 *
 *   0  1  2  3  4
 *   5  6  7  8  9
 *  10 11 12 13 14
 *
 * getRectangleCells(1, 12, 5)
 * → [1,2, 6,7, 11,12]
 */
export const getRectangleCells = (
  a: number,
  b: number,
  cols: number
): number[] => {

  // Convert flat indices into row coordinates
  const rowA = Math.floor(a / cols)
  const rowB = Math.floor(b / cols)

  // Convert flat indices into column coordinates
  const colA = a % cols
  const colB = b % cols

  // Determine vertical bounds of the rectangle
  const minRow = Math.min(rowA, rowB)
  const maxRow = Math.max(rowA, rowB)

  // Determine horizontal bounds of the rectangle
  const minCol = Math.min(colA, colB)
  const maxCol = Math.max(colA, colB)

  const result: number[] = []

  // Iterate over every row in the rectangle
  for (let r = minRow; r <= maxRow; r++) {

    // Iterate over every column in the rectangle
    for (let c = minCol; c <= maxCol; c++) {

      // Convert the (row, column) back to a flat array index
      result.push(r * cols + c)
    }
  }

  return result
}
