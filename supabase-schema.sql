-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table (租戶表)
CREATE TABLE tenants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  primary_color VARCHAR(7) DEFAULT '#c9a86c',
  secondary_color VARCHAR(7) DEFAULT '#f5f0e8',
  logo_url TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  line_id VARCHAR(100),
  instagram_id VARCHAR(100),
  business_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (服務表)
CREATE TABLE services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table (老師表)
CREATE TABLE teachers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  level VARCHAR(100),
  extra_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table (預約表)
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  user_email VARCHAR(255),
  user_note TEXT,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(5) NOT NULL, -- HH:MM format
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, completed
  health_declaration JSONB,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability table (時段可用性表)
CREATE TABLE availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time VARCHAR(5) NOT NULL, -- HH:MM format
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, date, time)
);

-- Create indexes for better performance
CREATE INDEX idx_services_tenant_id ON services(tenant_id);
CREATE INDEX idx_teachers_tenant_id ON teachers(tenant_id);
CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_user_phone ON bookings(user_phone);
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX idx_availability_tenant_date ON availability(tenant_id, date);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Frontend uses the anon key and never sets app.current_tenant.
-- Policies therefore allow access when tenant_id belongs to an existing tenant.
-- App queries still filter by the current tenant UUID.

CREATE POLICY "Public read access to tenants" ON tenants
  FOR SELECT USING (true);

CREATE POLICY "Public update access to tenants" ON tenants
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Services can be read by tenant" ON services
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Services can be inserted by tenant" ON services
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Services can be updated by tenant" ON services
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Services can be deleted by tenant" ON services
  FOR DELETE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Teachers can be read by tenant" ON teachers
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Teachers can be inserted by tenant" ON teachers
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Teachers can be updated by tenant" ON teachers
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Teachers can be deleted by tenant" ON teachers
  FOR DELETE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Bookings can be read by tenant" ON bookings
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Bookings can be inserted by tenant" ON bookings
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Bookings can be updated by tenant" ON bookings
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Bookings can be deleted by tenant" ON bookings
  FOR DELETE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Availability can be read by tenant" ON availability
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Availability can be inserted by tenant" ON availability
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Availability can be updated by tenant" ON availability
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants));

CREATE POLICY "Availability can be deleted by tenant" ON availability
  FOR DELETE USING (tenant_id IN (SELECT id FROM tenants));

-- Insert default tenant for testing
INSERT INTO tenants (name, subdomain, primary_color, secondary_color, contact_phone, contact_email)
VALUES ('AJ創美學苑', 'default', '#c9a86c', '#f5f0e8', '0912-345-678', 'contact@mystudio.com');

-- Insert default services for the default tenant
INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT 
  id, 
  '美睫服務', 
  'eyelash', 
  1200, 
  90, 
  '專業美睫設計，讓您的眼睛更有神'
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT 
  id, 
  '皮膚管理', 
  'skincare', 
  2500, 
  60, 
  '專業護膚疗程，恢復肌膚光采'
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT 
  id, 
  '眉型設計', 
  'eyebrow', 
  1800, 
  45, 
  '量身打造適合您的完美眉型'
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT 
  id, 
  '隱形眼線', 
  'eyeliner', 
  3000, 
  120, 
  '自然放大雙眼，不需每天畫眼線'
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT 
  id, 
  '頭皮保養', 
  'scalp', 
  2000, 
  60, 
  '專業頭皮護理，健康從頭開始'
FROM tenants WHERE subdomain = 'default';

-- Insert default teachers for the default tenant
INSERT INTO teachers (tenant_id, name, level, extra_fee)
SELECT id, '老師 A', '資深', 500 FROM tenants WHERE subdomain = 'default';

INSERT INTO teachers (tenant_id, name, level, extra_fee)
SELECT id, '老師 B', '主任', 800 FROM tenants WHERE subdomain = 'default';

INSERT INTO teachers (tenant_id, name, level, extra_fee)
SELECT id, '老師 C', '店長', 1200 FROM tenants WHERE subdomain = 'default';
