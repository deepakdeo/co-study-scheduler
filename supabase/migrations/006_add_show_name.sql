-- Add show_name column to bookings (default true so existing bookings are unaffected)
ALTER TABLE bookings ADD COLUMN show_name boolean DEFAULT true;
