DROP POLICY IF EXISTS "Confirmed bookings are publicly readable" ON bookings;
DROP POLICY IF EXISTS "Anyone can book a slot" ON bookings;
DROP POLICY IF EXISTS "Bookings can be updated" ON bookings;

CREATE POLICY "Bookings are publicly readable"
  ON bookings FOR SELECT USING (true);

CREATE POLICY "Anyone can book a slot"
  ON bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Bookings can be updated"
  ON bookings FOR UPDATE USING (true) WITH CHECK (true);
