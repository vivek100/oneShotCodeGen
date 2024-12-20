import { supabase } from "../supabase";

// Get table prefix from environment variable
const prefix = process.env.REACT_APP_TABLE_PREFIX;

export const dataProvider = {
  getList: async (
    resource,
    { pagination: { page, perPage }, sort: { field, order }, filter }
  ) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data, count, error } = await supabase
      .from(prefixedResource)
      .select("*", { count: "exact" })
      .range((page - 1) * perPage, page * perPage - 1)
      .order(field, { ascending: order === "ASC" });
    if (error) throw error;
    return { data, total: count };
  },

  getOne: async (resource, { id }) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data, error } = await supabase
      .from(prefixedResource)
      .select()
      .eq("id", id)
      .single();
    if (error) throw error;
    return { data };
  },

  create: async (resource, { data }) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data: record, error } = await supabase
      .from(prefixedResource)
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return { data: record };
  },

  update: async (resource, { id, data }) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data: record, error } = await supabase
      .from(prefixedResource)
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return { data: record };
  },

  delete: async (resource, { id }) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { error } = await supabase
      .from(prefixedResource)
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { data: id };
  },

  deleteMany: async (resource, { ids }) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { error } = await supabase
      .from(prefixedResource)
      .delete()
      .in("id", ids);
    if (error) throw error;
    return { data: ids };
  },

  getMany: async (resource, { ids }) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data, error } = await supabase
      .from(prefixedResource)
      .select()
      .in("id", ids);
    if (error) throw error;
    return { data };
  },

  getManyReference: async (
    resource,
    {
      target,
      id,
      pagination: { page, perPage },
      sort: { field, order },
      filter,
    }
  ) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data, count, error } = await supabase
      .from(prefixedResource)
      .select("*", { count: "exact" })
      .eq(target, id)
      .range((page - 1) * perPage, page * perPage - 1)
      .order(field, { ascending: order === "ASC" });
    if (error) throw error;
    return { data, total: count };
  },

  getAll: async (resource) => {
    const prefixedResource = `${prefix}_${resource}`;
    const { data, error } = await supabase
      .from(prefixedResource)
      .select("*");
    if (error) throw error;
    return { data };
  },

  aggregate: async (resource, { column, operation }) => {
    const prefixedResource = `${prefix}_${resource}`;
  
    if (!operation || !column) {
      throw new Error("Operation and column must be provided for aggregation");
    }
  
    try {
      // First check if there are any rows
      const { count, error: countError } = await supabase
        .from(prefixedResource)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // If no rows exist, return 0 or null based on operation
      if (count === 0) {
        return { 
          data: operation === 'count' ? 0 : null 
        };
      }

      // If rows exist, perform the aggregation
      const { data, error } = await supabase
        .from(prefixedResource)
        .select(`${column}.${operation}()`)
        
      console.log("data", data ? data[0][operation] : (operation === 'count' ? 0 : null));
  
      if (error) throw error;
  
      return { 
        data: data ? data[0][operation] : (operation === 'count' ? 0 : null)
      };
    } catch (error) {
      console.error('Aggregation error:', error);
      throw error;
    }
  }
  
};
