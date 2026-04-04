DROP POLICY "Bookings can be updated" ON bookings;

CREATE POLICY "Bookings can be updated"
  ON bookings FOR UPDATE
  USING (true)
  WITH CHECK (true);
