-- Seed data for profiles table
-- This will create some example profiles for testing

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  user_type,
  company_name,
  phone,
  bio,
  plan_type
) VALUES
-- Example buyer profile
(
  '00000000-0000-0000-0000-000000000001',
  'comprador@example.com',
  'María García López',
  'buyer',
  NULL,
  '+34 666 123 456',
  'Busco mi primera vivienda en Madrid. Me interesan apartamentos de 2-3 habitaciones en zonas bien comunicadas.',
  'free'
),
-- Example agent profile
(
  '00000000-0000-0000-0000-000000000002',
  'agente@example.com',
  'Carlos Rodríguez',
  'agent',
  'Inmobiliaria Madrid Central',
  '+34 915 789 012',
  'Agente inmobiliario con más de 10 años de experiencia en el mercado madrileño. Especializado en viviendas de lujo.',
  'premium'
)
ON CONFLICT (id) DO NOTHING;
