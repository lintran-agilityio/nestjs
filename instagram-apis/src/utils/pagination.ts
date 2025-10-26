import { WhereOptions } from 'sequelize';
import { omitField } from "./common";

type FormatDataPaginationType = {
  offset: number;
  limit: number;
  order: string[];
  model: any;
  fieldOmit?: string;
  where?: WhereOptions;
};

export const findAllData = async ({
  model,
  offset,
  limit,
  order,
  fieldOmit = '',
  where
}: FormatDataPaginationType) => {
  const { rows, count } = await model.findAndCountAll({
    where,
    limit,
    offset,
    order: [order],
    raw: true
  });

  const resFormatted = {
    data: rows.map((item: any) => omitField(item, fieldOmit)),
    meta: {
      pagination: {
        limit,
        offset,
        total: count
      }
    }
  };

  return resFormatted;
};