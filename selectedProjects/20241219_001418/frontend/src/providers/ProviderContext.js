import React, { createContext, useContext } from 'react';
import { dataProvider } from './dataProvider';

const ProviderContext = createContext(null);

export const ProviderProvider = ({ children }) => {
  return (
    <ProviderContext.Provider value={dataProvider}>
      {children}
    </ProviderContext.Provider>
  );
};

export const useProvider = (providerName) => {
  const provider = useContext(ProviderContext);
  if (!provider) {
    throw new Error('useProvider must be used within a ProviderProvider');
  }

  const fetchData = async (params = {}) => {
    try {
      // Check if this is a view or table
      const isView = providerName.includes('_view');
      const resource = isView ? providerName : providerName;
      
      const { data } = await provider.getList(resource, {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'id', order: 'DESC' },
        filter: params
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching data from provider ${providerName}:`, error);
      return [];
    }
  };

  return { fetchData };
}; 