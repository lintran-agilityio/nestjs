------------ How many boys and girls will start school during year x?  ------------
  ---- # Show the information of children who will start school in 2025 # ----
  SELECT
    first_name,
    last_name,
    date_of_birth,
    gender
  FROM household_manager.person
  WHERE
    date_part('year', person.date_of_birth) = 2019
    AND death_date IS NULL;

  ---- # Total children starting school in 2025 # ----
  SELECT
    COUNT(*) AS num_boys_starting_school
  FROM household_manager.person
  WHERE
    date_part('year', person.date_of_birth) = 2019
    AND death_date IS NULL;

------------ How many household have more than x person? ------------
 ---- # x person is 6 and person still in house # ----
  SELECT
    COUNT(*) AS household_count
  FROM (
    SELECT household_id, COUNT(person_id) AS member_count
    FROM household_manager.household_member hm
    where hm.end_date is null
    GROUP BY household_id
    HAVING COUNT(person_id) > 6
  ) h;

------------ How many person are single parents? ------------
  ---- # NUMBER person IS SINGLE PARENT # ----
  WITH active_parents as (
    SELECT parent_id
    FROM household_manager.parent_child pc
    WHERE pc.end_date IS NULL
    GROUP BY parent_id
  ),
  current_status as (
    SELECT distinct on (person_id) person_id, status
    FROM household_manager.personal_status ps
    WHERE ps.end_date IS NULL
    ORDER BY person_id, start_date DESC
  )
  SELECT
    COUNT(*) AS single_parent_count
  FROM household_manager.person p
  JOIN active_parents ap ON p.id = ap.parent_id
  JOIN current_status cs ON p.id = cs.person_id
  WHERE NOT cs.status = 'married';

  ---- # INFORMATION OF SINGLE PARENT # ----
  WITH active_parents as (
    SELECT parent_id
    FROM household_manager.parent_child pc
    WHERE pc.end_date IS NULL
    GROUP BY parent_id
  ),
  current_status as (
    SELECT distinct on (person_id) person_id, status
    FROM household_manager.personal_status ps
    WHERE ps.end_date IS NULL
    ORDER BY person_id, start_date DESC
  )
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.date_of_birth,
    p.gender,
    cs.status as current_personal_status
  FROM household_manager.person p
  JOIN active_parents ap ON p.id = ap.parent_id
  JOIN current_status cs ON p.id = cs.person_id
  WHERE NOT cs.status = 'married';

------------ In how many household is at least one member unemployed? ------------
  ---- # NUMBER HOUSEHOLD WITH UNEMPLOYED MEMBER # ----
  with current_job as (
    select distinct on (person_id) person_id, status
    from household_manager.job_status_history jsh
    order by person_id, start_date desc
  )
  select count(distinct hm.household_id) as household_with_unemployed
  from household_manager.household_member hm
  join current_job cj on hm.person_id = cj.person_id
  where
    hm.end_date is null 
    and cj.status = 'unemployed';


  ---- # NUMBER OF person IS UNEMPLOYED IN HOUSEHOLD # ----
  WITH current_job AS (
    SELECT DISTINCT ON (person_id) person_id, status
    FROM household_manager.job_status_history jsh
    ORDER BY person_id, start_date DESC
  )
  SELECT 
    hm.household_id,
    COUNT(*) AS num_unemployed
  FROM household_manager.household_member hm
  JOIN current_job cj ON hm.person_id = cj.person_id
  WHERE
    hm.end_date IS NULL
    AND cj.status = 'unemployed'
  GROUP BY hm.household_id;

------------ How many household have a total income that is less than the norm for receiving social benefits? ------------
  ---- income that is less than the norm is 2000000 ----
  ---- # NUMBER HOUSEHOLD WITH INCOME LESS THAN 2000000 # ----
  with total_income as (
    select
      i.household_id,
      sum(i.amount) as household_income
    from household_manager.income i
    group by i.household_id 
  ),
  number_person_in_house as (
    select
      hm.household_id,
      count(hm.person_id) as member_in_household
    from household_manager.household_member hm 
    where hm.end_date is null 
    group by hm.household_id 
  ),
  household_income as (
    select
      h.id,
      h.address,
      coalesce(ti.household_income, 0) as total_income,
      nph.member_in_household,
      round(
        coalesce(ti.household_income, 0)::numeric / nph.member_in_household 
      ) as income_per_person
    from household_manager.household h
    join number_person_in_house nph on h.id = nph.household_id 
    left join total_income ti on h.id = ti.household_id 
  )
  SELECT  
    COUNT(*) AS low_income_household_count
  FROM (
    SELECT    
      hm.household_id,
      SUM(i.amount) AS total_income
    FROM household_manager.household_member hm
    JOIN household_manager.income i ON hm.person_id = i.person_id
    WHERE
      hm.end_date IS NULL
      -- summing income records per member
    GROUP BY hm.household_id
    HAVING SUM(i.amount) < 2000000
  ) AS low_income_household;
  
-- How many grandchildren does a person have?
  select
		grandparent.id as grandparent_id,
		grandparent.first_name,
		grandparent.last_name,
		count(grandchild.id) as grand_children
	from household_manager.person grandparent
	join household_manager.parent_child pc1 on grandparent.id = pc1.parent_id
	join household_manager.parent_child pc2 on pc1.child_id = pc2.parent_id
	join household_manager.person grandchild on pc2.child_id = grandchild.id
	group by grandparent.id, grandparent.first_name, grandparent.last_name
	order by grand_children desc


-- Get data for tree view of parent-child relationship
  -- Count the number children for each parent
  select
    ancestor_id,
    count(*) as children
  from household_manager.parent_child_closure
  where depth = 1
  group by ancestor_id;

  -- Count the number grandchildren for each grandparent
  select
    ancestor_id,
    count(*) as grandchildren
  from household_manager.parent_child_closure
  where depth = 2
  group by ancestor_id;

-- Get information of person with their number of children and grandchildren
  select *
  from household_manager.person p 
  where p.path_relationship like '550e8400-e29b-41d4-a716-446655440004.%';


-- Add email indexs into person table
CREATE INDEX idx_person_email ON household_manager.person USING btree (email);

-- Check table in and check time implement query
explain analyze select * from household_manager.people p where email='quinn.brown227@example.com';

explain analyze select * from household_manager.person p where email='quinn.brown227@example.com';
