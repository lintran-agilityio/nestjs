-- Household Management Database Test Data
-- This file contains test data for all tables.

-- Make this script idempotent when re-run locally
TRUNCATE TABLE
  household_manager.income,
  household_manager.household_member,
  household_manager.household,
  household_manager.personal_status,
  household_manager.parent_child,
  household_manager.parent_child_closure,
  household_manager.job_status_history,
  household_manager.residency,
  household_manager.person
CASCADE;

-- Insert Person table
INSERT INTO household_manager.person (id, first_name, last_name, date_of_birth, gender, death_date, path_relationship) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'John', 'Doe', '1980-05-15', 'M', NULL, '550e8400-e29b-41d4-a716-446655440004.550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440001', 'Jane', 'Smith', '1990-07-22', 'F', NULL, '550e8400-e29b-41d4-a716-446655440007.550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440002', 'Alice', 'Johnson', '1975-03-30', 'F', NULL, '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob', 'Brown', '2000-11-12', 'M', NULL, '550e8400-e29b-41d4-a716-446655440005.550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440004', 'Charlie', 'Davis', '1965-01-25', 'M', NULL, '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440005', 'Diana', 'Miller', '1985-09-10', 'F', NULL, '550e8400-e29b-41d4-a716-446655440005'),
('550e8400-e29b-41d4-a716-446655440006', 'Eve', 'Wilson', '1995-12-05', 'F', NULL, '550e8400-e29b-41d4-a716-446655440002.550e8400-e29b-41d4-a716-446655440006'),
('550e8400-e29b-41d4-a716-446655440007', 'Frank', 'Moore', '1970-04-18', 'M', NULL, '550e8400-e29b-41d4-a716-446655440007'),
('550e8400-e29b-41d4-a716-446655440008', 'Grace', 'Taylor', '2003-06-29', 'F', NULL, '550e8400-e29b-41d4-a716-446655440002.550e8400-e29b-41d4-a716-446655440006'),
('550e8400-e29b-41d4-a716-446655440009', 'Hank', 'Anderson', '1955-02-14', 'M', NULL, '550e8400-e29b-41d4-a716-446655440009'),
('550e8400-e29b-41d4-a716-446655440010', 'Tran', 'An', '2010-05-12', 'M', NULL, '550e8400-e29b-41d4-a716-446655440019.550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440011', 'Nguyen', 'An', '2010-05-12', 'M', NULL, '550e8400-e29b-41d4-a716-446655440004.550e8400-e29b-41d4-a716-446655440000.550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440012', 'Tran', 'Binh', '2008-09-23', 'M', NULL, '550e8400-e29b-41d4-a716-446655440009.550e8400-e29b-41d4-a716-446655440014.550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440013', 'Le', 'Chi', '2012-01-17', 'F', NULL, '550e8400-e29b-41d4-a716-446655440015.550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440014', 'Pham', 'Dung', '1980-07-01', 'M', '2020-04-15', '550e8400-e29b-41d4-a716-446655440009.550e8400-e29b-41d4-a716-446655440014'),
('550e8400-e29b-41d4-a716-446655440015', 'Hoang', 'Lan', '1995-03-09', 'F', NULL, '550e8400-e29b-41d4-a716-446655440015'),
('550e8400-e29b-41d4-a716-446655440016', 'Vu', 'Minh', '2018-11-22', 'O', NULL, '550e8400-e29b-41d4-a716-446655440007.550e8400-e29b-41d4-a716-446655440001.550e8400-e29b-41d4-a716-446655440016'),
('550e8400-e29b-41d4-a716-446655440017', 'Do', 'Hanh', '1970-06-30', 'F', NULL, '550e8400-e29b-41d4-a716-446655440017'),
('550e8400-e29b-41d4-a716-446655440018', 'Bui', 'Khang', '2005-08-14', 'M', NULL, '550e8400-e29b-41d4-a716-446655440002.550e8400-e29b-41d4-a716-446655440006.550e8400-e29b-41d4-a716-446655440018'),
('550e8400-e29b-41d4-a716-446655440019', 'Dang', 'Linh', '1988-12-03', 'F', NULL, '550e8400-e29b-41d4-a716-446655440019'),
('550e8400-e29b-41d4-a716-446655440020', 'Ly', 'Nam', '2011-04-27', 'M', NULL, '550e8400-e29b-41d4-a716-446655440021'),
('550e8400-e29b-41d4-a716-446655440021', 'Cao', 'Phu', '1992-10-19', 'M', NULL, '550e8400-e29b-41d4-a716-446655440021.550e8400-e29b-41d4-a716-446655440020'),
('550e8400-e29b-41d4-a716-446655440022', 'Ha', 'Thu', '2025-01-19', 'M', NULL, '550e8400-e29b-41d4-a716-446655440002.550e8400-e29b-41d4-a716-446655440006.550e8400-e29b-41d4-a716-446655440018.550e8400-e29b-41d4-a716-446655440021');

-- Insert Residency table

INSERT INTO household_manager.residency (person_id, address, start_date, end_date) VALUES
('550e8400-e29b-41d4-a716-446655440000', '123 Le Loi, Da Nang', '2010-05-12', NULL),
('550e8400-e29b-41d4-a716-446655440001', '45 Nguyen Trai, Ha Noi', '2015-01-01', '2020-01-01'),
('550e8400-e29b-41d4-a716-446655440002', '99 Tran Phu, Ho Chi Minh City', '2018-07-15', NULL),
('550e8400-e29b-41d4-a716-446655440003', '12 Bach Dang, Hue', '2005-03-10', '2019-12-31'),
('550e8400-e29b-41d4-a716-446655440004', '8 Vo Thi Sau, Can Tho', '2020-06-01', NULL),
('550e8400-e29b-41d4-a716-446655440005', '77 Hai Ba Trung, Da Nang', '2012-11-20', '2018-11-20'),
('550e8400-e29b-41d4-a716-446655440006', '33 Le Duan, Ha Noi', '2016-04-05', NULL),
('550e8400-e29b-41d4-a716-446655440007', '56 Nguyen Hue, Ho Chi Minh City', '2019-09-09', NULL),
('550e8400-e29b-41d4-a716-446655440008', '21 Phan Dinh Phung, Hue', '2008-12-12', '2015-12-12'),
('550e8400-e29b-41d4-a716-446655440009', '14 Tran Hung Dao, Can Tho', '2021-03-03', NULL);

-- Insert Job Status History table
INSERT INTO household_manager.job_status_history (person_id, status, start_date, end_date)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'student',   '2008-09-01', '2012-06-30'),
  ('550e8400-e29b-41d4-a716-446655440000', 'employed',  '2012-07-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440001', 'employed',  '2000-03-15', '2018-12-31'),
  ('550e8400-e29b-41d4-a716-446655440001', 'retired',   '2019-01-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'unemployed','2015-05-01', '2016-05-01'),
  ('550e8400-e29b-41d4-a716-446655440002', 'employed',  '2016-06-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'student',   '2018-09-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'employed',  '1990-01-01', '2020-12-31'),
  ('550e8400-e29b-41d4-a716-446655440004', 'retired',   '2021-01-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440005', 'employed',  '2010-06-15', NULL),
  ('550e8400-e29b-41d4-a716-446655440006', 'student',   '2014-09-01', '2018-06-30'),
  ('550e8400-e29b-41d4-a716-446655440006', 'employed',  '2018-07-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440007', 'employed',  '2017-03-20', NULL),
  ('550e8400-e29b-41d4-a716-446655440008', 'student',   '2009-09-01', '2013-06-30'),
  ('550e8400-e29b-41d4-a716-446655440008', 'employed',  '2013-07-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440009', 'retired',   '2015-05-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440021', 'unemployed', '2024-01-01', null);

-- Insert Parent Child table
-- INSERT INTO household_manager.parent_child (parent_id, child_id, start_date, end_date) VALUES
-- John Doe (1980) is father Tran An (2010) and Nguyen An (2010)
-- ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '2010-05-12', NULL),
-- ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', '2010-05-12', NULL),

-- Jane Smith (1990) is mother of Tran Binh (2008) and Le Chi (2012)
-- ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', '2008-09-23', NULL),
-- ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013', '2012-01-17', NULL),

-- Bob Brown (2000) is father Ly Nam (2011)
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440020', '2011-04-27', NULL),

-- Diana Miller (1985) is mother of Vu Minh (2018)
-- ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440016', '2018-11-22', NULL),

-- Pham Dung (1980, was die) is father of Bui Khang (2005)
-- ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018', '2005-08-14', '2020-04-15'),

-- Do Hanh (1970) is mother of Dang Linh (1988) and Cao Phu (1992)
-- ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440019', '1988-12-03', NULL),
-- ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440021', '1992-10-19', NULL),

-- Grace Taylor (2003) single mother of Ly Nam (2011)
-- ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440020', '2011-04-27', NULL),

-- Hank Anderson (1955) is single father of Hoang Lan (1995)
-- ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440015', '1995-03-09', NULL),

-- Alice Johnson (1975) is single mother Tran Binh (2008)
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '2008-09-23', NULL);

-- Add Parent
SELECT add_person('John', 'Father');
SELECT add_person('Jane', 'Mother');

SELECT add_person('Diana', 'Mother');
SELECT add_person('Frank', 'Father');
SELECT add_person('Pham', 'Father');
SELECT add_person('Hoang', 'Mother');
SELECT add_person('Dang', 'Mother');
SELECT add_person('Cao', 'Father');

-- Add grandparent
SELECT add_person('Alice', 'Grandmother');
SELECT add_person('Charlie', 'Grandfather');
SELECT add_person('Hank', 'Grandfather');
SELECT add_person('Do', 'GrandMother');

-- Add children
SELECT add_person('Bob', 'Son');
SELECT add_person('Eve', 'Daughter');
SELECT add_person('Grace', 'Daughter');
SELECT add_person('Nguyen', 'Son');
SELECT add_person('Tran', 'Son');
SELECT add_person('Le', 'Daughter');
SELECT add_person('Vu', 'O');
SELECT add_person('Bui', 'Son');
SELECT add_person('Ly', 'Son');

-- Add parent-child relationships
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010'); -- John -> Tran An
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011'); -- John -> Nguyen An
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012'); -- Jane -> Tran Binh
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440013'); -- Jane -> Le Chi
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000'); -- Charlie -> John
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003'); -- Charlie -> Bob
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001'); -- Hank -> Jane
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440015'); -- Hank -> Hoang Lan
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440016'); -- Diana -> Vu Minh
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005'); -- Frank -> Diana
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018'); -- Pham -> Bui Khang
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440019'); -- Do -> Dang Linh
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440021'); -- Do -> Cao Phu
SELECT household_manager.add_parent_child('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012'); -- Alice -> Tran Binh

--- # Insert Personal Status table # ---
INSERT INTO household_manager.personal_status (person_id, status, start_date, end_date) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'married', '2005-06-15', NULL),

-- Jane Smith (1990) → single
('550e8400-e29b-41d4-a716-446655440001', 'single', '2008-01-01', NULL),

-- Alice Johnson (1975) → divorced 2010
('550e8400-e29b-41d4-a716-446655440002', 'divorced', '2000-03-15', '2010-09-20'),

-- Bob Brown (2000) → single
('550e8400-e29b-41d4-a716-446655440003', 'single', '2018-07-01', NULL),

-- Charlie Davis (1965) → widowed 2015
('550e8400-e29b-41d4-a716-446655440004', 'widowed', '1990-04-10', '2015-05-12'),

-- Diana Miller (1985) → married from 2012
('550e8400-e29b-41d4-a716-446655440005', 'married', '2012-10-20', NULL),

-- Eve Wilson (1995) → single
('550e8400-e29b-41d4-a716-446655440006', 'single', '2015-01-01', NULL),

-- Frank Moore (1970) → married from 1998
('550e8400-e29b-41d4-a716-446655440007', 'married', '1998-06-05', NULL),

-- Grace Taylor (2003) → single
('550e8400-e29b-41d4-a716-446655440008', 'single', '2020-09-01', NULL),

-- Hank Anderson (1955) → widowed từ 2000
('550e8400-e29b-41d4-a716-446655440009', 'widowed', '1980-03-03', '2000-07-10'),

-- Tran An (2010) → single
('550e8400-e29b-41d4-a716-446655440010', 'single', '2025-01-01', NULL),

-- Nguyen An (2010) → single
('550e8400-e29b-41d4-a716-446655440011', 'single', '2025-01-01', NULL),

-- Tran Binh (2008) → single
('550e8400-e29b-41d4-a716-446655440012', 'single', '2025-01-01', NULL),

-- Le Chi (2012) → single
('550e8400-e29b-41d4-a716-446655440013', 'single', '2025-01-01', NULL),

-- Pham Dung (1980, was die 2020) → married
('550e8400-e29b-41d4-a716-446655440014', 'married', '2005-09-09', '2020-04-15'),

-- Hoang Lan (1995) → single
('550e8400-e29b-41d4-a716-446655440015', 'single', '2015-01-01', NULL),

-- Vu Minh (2018) → single
('550e8400-e29b-41d4-a716-446655440016', 'single', '2025-01-01', NULL),

-- Do Hanh (1970) → divorced 2005
('550e8400-e29b-41d4-a716-446655440017', 'divorced', '1990-01-01', '2005-06-30'),

-- Bui Khang (2005) → single
('550e8400-e29b-41d4-a716-446655440018', 'single', '2025-01-01', NULL),

-- Dang Linh (1988) → married from 2018
('550e8400-e29b-41d4-a716-446655440019', 'married', '2018-03-08', NULL),

-- Ly Nam (2011) → single
('550e8400-e29b-41d4-a716-446655440020', 'single', '2025-01-01', NULL),

-- Cao Phu (1992) → married from 2020
('550e8400-e29b-41d4-a716-446655440021', 'married', '2020-11-22', NULL);


-- # Insert Household table # --
INSERT INTO household_manager.household (id, address, formation_date, dissolution_date) VALUES
-- Family 1 (John & Jane)
('660e8400-e29b-41d4-a716-446655440100', '123 Main St, Hanoi', '2005-01-01', NULL),

-- Family 2 (Alice & child)
('660e8400-e29b-41d4-a716-446655440101', '45 Le Loi, Ho Chi Minh City', '2010-06-15', NULL),

-- Family 3 (Charlie - widower)
('660e8400-e29b-41d4-a716-446655440102', '78 Tran Hung Dao, Da Nang', '1990-03-12', NULL),

-- Family 4 (Hank - live with children)
('660e8400-e29b-41d4-a716-446655440103', '22 Nguyen Trai, Hue', '1985-11-05', NULL),

-- Family 5 (Diana & Frank)
('660e8400-e29b-41d4-a716-446655440104', '56 Phan Boi Chau, Hai Phong', '2012-10-20', NULL),

-- Family 6 (Hoang Lan - single mother)
('660e8400-e29b-41d4-a716-446655440105', '34 Nguyen Van Linh, Can Tho', '2015-07-01', NULL),

-- Family 7 (Do Hanh - divorced, live with children)
('660e8400-e29b-41d4-a716-446655440106', '90 Dinh Tien Hoang, Quang Ninh', '2000-09-09', NULL),

-- Family 8 (Dang Linh & Cao Phu)
('660e8400-e29b-41d4-a716-446655440107', '12 Le Duan, Da Lat', '2020-11-22', NULL),

-- Family 9
('660e8400-e29b-41d4-a716-446655440108', '77 Bach Dang, Hai Duong', '2018-11-22', NULL),

-- Family 10 (Old collective family, dissolved)
('660e8400-e29b-41d4-a716-446655440109', '5 Ly Thuong Kiet, Nam Dinh', '1975-04-30', '2005-05-01');


-- # Insert household_member table # --
-- Family 1: John (head), Jane (spouse), 2 con
INSERT INTO household_manager.household_member (id, household_id, person_id, role, start_date, end_date) VALUES
('770e8400-e29b-41d4-a716-446655440200', '660e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440000', 'head',   '2005-01-01', NULL), -- John
('770e8400-e29b-41d4-a716-446655440201', '660e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', 'spouse', '2005-01-01', NULL), -- Jane
('770e8400-e29b-41d4-a716-446655440202', '660e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440010', 'child_id', '2010-05-12', NULL), -- Tran An
('770e8400-e29b-41d4-a716-446655440203', '660e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440011', 'child_id', '2010-05-12', NULL), -- Nguyen An

-- Family 2: Alice (head), Binh (child)
('770e8400-e29b-41d4-a716-446655440204', '660e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440002', 'head', '2010-06-15', NULL), -- Alice
('770e8400-e29b-41d4-a716-446655440205', '660e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440012', 'child_id', '2008-09-23', NULL), -- Tran Binh
('770e8400-e29b-41d4-a716-446655440220', '660e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440020', 'child_id', '2008-09-23', NULL), -- Tran Binh
('770e8400-e29b-41d4-a716-446655440221', '660e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'child_id', '2012-01-17', NULL), -- Le Chi

-- Family 3: Charlie (head)
('770e8400-e29b-41d4-a716-446655440206', '660e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440004', 'head', '1990-03-12', NULL), -- Charlie

-- Family 4: Hank (head), Hoang Lan(child)
('770e8400-e29b-41d4-a716-446655440207', '660e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440009', 'head', '1985-11-05', NULL), -- Hank
('770e8400-e29b-41d4-a716-446655440208', '660e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440015', 'child_id', '1995-03-09', NULL), -- Hoang Lan

-- Family 5: Frank (head), Diana (spouse)
('770e8400-e29b-41d4-a716-446655440209', '660e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440007', 'head', '2012-10-20', NULL), -- Frank
('770e8400-e29b-41d4-a716-446655440210', '660e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440005', 'spouse', '2012-10-20', NULL), -- Diana

-- Family 6: Hoang Lan (head), Vu Minh (child)
('770e8400-e29b-41d4-a716-446655440211', '660e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440015', 'head', '2015-07-01', NULL), -- Hoang Lan
('770e8400-e29b-41d4-a716-446655440212', '660e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440016', 'child_id', '2018-11-22', NULL), -- Vu Minh

-- Family 7: Do Hanh (head), Bui Khang (child)
('770e8400-e29b-41d4-a716-446655440213', '660e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440017', 'head', '2000-09-09', NULL), -- Do Hanh
('770e8400-e29b-41d4-a716-446655440214', '660e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440018', 'child_id', '2005-08-14', NULL), -- Bui Khang

-- Family 8: Dang Linh (head), Cao Phu (spouse)
('770e8400-e29b-41d4-a716-446655440215', '660e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440019', 'head', '2020-11-22', NULL), -- Dang Linh
('770e8400-e29b-41d4-a716-446655440216', '660e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440021', 'spouse', '2020-11-22', NULL), -- Cao Phu

-- Family 9: Vu Minh (child), Grace (head)
('770e8400-e29b-41d4-a716-446655440217', '660e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440008', 'head', '2018-11-22', NULL), -- Grace
('770e8400-e29b-41d4-a716-446655440218', '660e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440016', 'child_id', '2018-11-22', NULL), -- Vu Minh

-- Family 10: Charlie Davis (Old collective family, dissolved)
('770e8400-e29b-41d4-a716-446655440219', '660e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440004', 'head', '1975-04-30', '2005-05-01'); -- Charlie

-- # Insert Income table # --
INSERT INTO household_manager.income (person_id, household_id, amount, income_type, start_date, end_date) VALUES
-- John Doe (1980)
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440100', 15000000.00, 'salary', '2023-01-01', NULL),

-- Jane Smith (1990) -> salary + investment
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440100', 12000000.00, 'salary', '2023-01-01', NULL),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440100', 2500000.00, 'investment', '2024-03-01', NULL),

-- Alice Johnson (1975) -> business
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440104', 8000000.00, 'business', '2022-05-01', NULL),

-- Bob Brown (2000) -> student (part-time job)
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440101', 3000000.00, 'salary', '2024-09-01', NULL),

-- Charlie Davis (1965) -> pension
('550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440102', 5000000.00, 'pension', '2020-01-01', NULL),

-- Diana Miller (1985) -> salary
('550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440104', 10000000.00, 'salary', '2023-06-01', NULL),

-- Eve Wilson (1995) -> unemployed (subsidy)
('550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440104', 2000000.00, 'other', '2024-01-01', '2024-12-31'),

-- Frank Moore (1970) -> subsidy
('550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440104', 12000000.00, 'business', '2021-02-01', NULL),

-- Hank Anderson (1955) -> pension
('550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440103', 6000000.00, 'pension', '2015-01-01', NULL),

-- Hoang Lan (1995) -> salary
('550e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440105', 1000000.00, 'salary', '2022-08-01', NULL),

-- Do Hanh (1970) -> teacher
('550e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440106', 3000000.00, 'salary', '2019-09-01', NULL),

-- Dang Linh (1988) -> salary
('550e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440107', 1500000.00, 'salary', '2023-03-01', NULL),

-- Cao Phu (1992) -> salary + investment
('550e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440107', 13000000.00, 'salary', '2021-01-01', NULL),
('550e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440107', 4000000.00, 'investment', '2022-01-01', NULL);


WITH
name AS (
  SELECT ARRAY[
   'Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Garcia','Rodriguez','Wilson',
   'Martinez','Anderson','Taylor','Thomas','Hernandez','Moore','Martin','Jackson','Thompson','White'
  ] AS arr
)
INSERT INTO household_manager.people (
  id,
  name,
  birthday,
  gender,
  path,
  email
)
select
	household_manager.uuid_generate_v4() AS id,
  name.arr[idxs.fi] AS name,
  (date '1950-01-01' + (random()*20000)::int * INTERVAL '1 day')::date AS birthday,
  (ARRAY[
     'M'::household_manager.gender_enum,
     'F'::household_manager.gender_enum,
     'O'::household_manager.gender_enum
  ])[ (floor(random()*3) + 1)::int ] AS gender,
  'path_' || g AS path,
  lower(fn.arr[idxs.fi] || '.' || ln.arr[idxs.li] || g || '@example.com') AS email
FROM generate_series(1,1000) AS g
CROSS JOIN fn
CROSS JOIN ln
CROSS JOIN LATERAL (
  SELECT
    (floor(random()*cardinality(fn.arr)) + 1)::int AS fi,
    (floor(random()*cardinality(ln.arr)) + 1)::int AS li
) idxs;