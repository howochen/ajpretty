-- This script only updates data for existing tables
-- Run this if you already ran the schema and just need to update the data

-- Update default tenant
UPDATE tenants 
SET name = 'AJ創美學苑',
    primary_color = '#c9a86c',
    secondary_color = '#f5f0e8',
    contact_phone = '0912-345-678',
    contact_email = 'contact@mystudio.com'
WHERE subdomain = 'default';

-- If no tenant exists, insert it
INSERT INTO tenants (name, subdomain, primary_color, secondary_color, contact_phone, contact_email)
SELECT 'AJ創美學苑', 'default', '#c9a86c', '#f5f0e8', '0912-345-678', 'contact@mystudio.com'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE subdomain = 'default');

-- Clear existing services for default tenant
DELETE FROM services WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'default');

-- Insert default services for the default tenant
INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT id, '美睫服務', '美睫', 1500, 90, '專業美睫設計，讓您的眼睛更有神' 
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT id, '皮膚管理', '護膚', 2000, 60, '專業護膚疗程，恢復肌膚光采' 
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT id, '眉型設計', '眉毛', 1200, 45, '量身打造適合您的完美眉型' 
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT id, '隱形眼線', '眼妝', 1800, 60, '自然隱形眼線，讓眼睛更有神' 
FROM tenants WHERE subdomain = 'default';

INSERT INTO services (tenant_id, name, category, price, duration, description)
SELECT id, '頭皮保養', '頭皮', 2500, 90, '專業頭皮護理，健康從頭開始' 
FROM tenants WHERE subdomain = 'default';

-- Clear existing teachers for default tenant
DELETE FROM teachers WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'default');

-- Insert default teachers for the default tenant
INSERT INTO teachers (tenant_id, name, level, extra_fee)
SELECT id, '老師 A', '資深', 500 FROM tenants WHERE subdomain = 'default';

INSERT INTO teachers (tenant_id, name, level, extra_fee)
SELECT id, '老師 B', '主任', 800 FROM tenants WHERE subdomain = 'default';

INSERT INTO teachers (tenant_id, name, level, extra_fee)
SELECT id, '老師 C', '店長', 1200 FROM tenants WHERE subdomain = 'default';
