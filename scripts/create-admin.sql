-- Crear tenant
INSERT INTO "Tenant" (id, name, rut, slug, "createdAt", "updatedAt")
VALUES ('demo-tenant-001', 'Corredora Demo', '76.123.456-7', 'demo', NOW(), NOW());

-- Crear usuario admin (contraseña: Admin123!)
-- Hash bcrypt de "Admin123!": $2a$10$YourHashHere
INSERT INTO "User" (id, email, name, password, role, "tenantId", "createdAt", "updatedAt")
VALUES (
  'admin-user-001',
  'admin@demo.cl',
  'Administrador',
  '$2a$10$rOvHq3qZ9xGxK.vN8YqJXeYKZqH5qH5qH5qH5qH5qH5qH5qH5qH5q',
  'BROKERAGE_ADMIN',
  'demo-tenant-001',
  NOW(),
  NOW()
);
