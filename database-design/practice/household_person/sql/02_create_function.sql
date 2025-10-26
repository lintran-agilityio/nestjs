-- Create function add person in closure table
CREATE OR REPLACE FUNCTION add_person(fname VARCHAR(50), lname VARCHAR(50))
RETURNS UUID AS $$
DECLARE
  new_person_id UUID;
BEGIN
  INSERT INTO household_manager.person (first_name, last_name)
  VALUES (fname, lname)
  RETURNING id INTO new_person_id;

  -- Add self relationship in closure tables
  INSERT INTO parent_child_closure (ancestor_id, descendant_id, depth)
  VALUES (new_person_id, new_person_id, 0); -- Self relationship
  RETURN new_person_id;
END;
$$ LANGUAGE plpgsql; 

-- Add relationship of parent-child in closure table
CREATE OR REPLACE FUNCTION add_parent_child1(parent_id int, child_id int) RETURNS VOID AS $$
BEGIN

  -- Self parent
  INSERT INTO parent_child_closure (ancestor_id, descendant_id, depth)
  VALUES (parent_id, child_id, 1);

  -- All ancestor of parent and self as ancestor of child
  INSERT INTO parent_child_closure (ancestor_id, descendant_id, depth)
  SELECT ancestor_id, child_id, depth + 1
  FROM household_manager.parent_child_closure
  WHERE descendant_id = parent_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION household_manager.add_parent_child(parent_id UUID, child_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Prevent if parent = child
  IF parent_id = child_id THEN
    RAISE EXCEPTION 'Parent and child cannot be the same person';
  END IF;

  -- Check if the relationship already exists
  IF EXISTS (
    SELECT 1
    FROM household_manager.parent_child_closure
    WHERE ancestor_id = parent_id AND descendant_id = child_id
  ) THEN
    RAISE EXCEPTION 'The parent-child relationship already exists: % -> %', parent_id, child_id;
  END IF;

  -- Ensure self rows exist
  INSERT INTO household_manager.parent_child_closure (ancestor_id, descendant_id, depth)
  VALUES (parent_id, parent_id, 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO household_manager.parent_child_closure (ancestor_id, descendant_id, depth)
  VALUES (child_id, child_id, 0)
  ON CONFLICT DO NOTHING;

  -- Insert all ancestor-descendant pairs
  INSERT INTO household_manager.parent_child_closure (ancestor_id, descendant_id, depth)
  SELECT sup.ancestor_id, sub.descendant_id, sup.depth + sub.depth + 1
  FROM household_manager.parent_child_closure sup
  CROSS JOIN household_manager.parent_child_closure sub
  WHERE sup.descendant_id = parent_id
    AND sub.ancestor_id = child_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

