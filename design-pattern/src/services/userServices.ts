import Database from "../db";

export const getUsers = async() => {
  const db = Database.getInstance();
  const result = await db.query("SELECT * FROM users");
  return result.rows;
};
